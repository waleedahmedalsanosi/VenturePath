"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export interface SendMessageResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

const SendMessageSchema = z.object({
  inquiryId: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

/**
 * sendInquiryMessage — inserts a row into connection_inquiry_messages.
 *
 * Auth is enforced at two levels:
 *   1. RLS policy "inquiry messages — both parties send" ensures the caller is
 *      a party to the inquiry AND the inquiry status is 'sent' or 'accepted'.
 *   2. The sender_user_id column is set to auth.uid() which is verified by RLS.
 *
 * NOTE: account_notifications triggers exist on connection_inquiries, not on
 * connection_inquiry_messages. Extending notification triggers for reply
 * messages is out of scope for v1.1 and should be addressed in a future batch.
 */
export async function sendInquiryMessage(
  inquiryId: string,
  body: string,
): Promise<SendMessageResult> {
  const parsed = SendMessageSchema.safeParse({ inquiryId, body });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("connection_inquiry_messages")
    .insert({
      inquiry_id: parsed.data.inquiryId,
      sender_user_id: user.id,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (error) {
    // RLS violation surfaces as PGRST301 / 42501
    if (error.code === "42501" || error.code === "PGRST301") {
      return {
        ok: false,
        error:
          "You are not allowed to send messages on this inquiry, or the inquiry is closed.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/messages/${parsed.data.inquiryId}`);
  return { ok: true, messageId: data.id };
}
