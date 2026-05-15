import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { InviteForm } from "./invite-form";
import { MemberActions } from "./member-actions";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  viewer: "Viewer",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, owner_user_id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) redirect("/setup");

  // Members include the owner. Join with auth.users via RPC-less workaround
  // using a separate query. For prototype we display user_id; owner shows
  // their email since we have it.
  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, added_at")
    .eq("workspace_id", workspace.id)
    .order("added_at", { ascending: true });

  const { data: invitations } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Members
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Invite people to view this workspace. Invitees become read-only
          viewers — only you (the owner) can edit cap table, ESOP, vault, etc.
        </p>
      </header>

      <section className="rounded-xl bg-(--color-surface-container-low) p-6">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Invite a viewer
        </h2>
        <InviteForm />
      </section>

      {invitations && invitations.length > 0 && (
        <section>
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
            Pending invitations
          </h2>
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Email</th>
                  <th className="px-4 py-3 text-start font-normal">Role</th>
                  <th className="px-4 py-3 text-start font-normal">Expires</th>
                  <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-t border-(--color-outline-variant)/15">
                    <td className="px-4 py-3 font-mono">{inv.invited_email}</td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {ROLE_LABEL[inv.role]}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                      {fmtDate(inv.expires_at)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <MemberActions
                        kind="invitation"
                        id={inv.id}
                        workspaceId={inv.workspace_id}
                        userId={inv.invited_email}
                        inviteToken={inv.token}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          {members?.length === 1 ? "1 member" : `${members?.length ?? 0} members`}
        </h2>
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">User</th>
                <th className="px-4 py-3 text-start font-normal">Role</th>
                <th className="px-4 py-3 text-start font-normal">Joined</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m) => {
                const isYou = m.user_id === user.id;
                return (
                  <tr key={m.user_id} className="border-t border-(--color-outline-variant)/15">
                    <td className="px-4 py-3 font-mono">
                      {isYou ? user.email : m.user_id.slice(0, 8) + "…"}
                      {isYou && (
                        <span className="ml-2 text-label-sm text-(--color-on-surface-variant)">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {ROLE_LABEL[m.role]}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                      {fmtDate(m.added_at)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {m.role !== "owner" && (
                        <MemberActions
                          kind="member"
                          id={m.user_id}
                          workspaceId={m.workspace_id}
                          userId={m.user_id}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
