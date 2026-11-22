"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { IdCard, KeyRound, Lock, Pencil, ShieldCheck, Sparkles, Trash2, UserPlus, UserRound, Users } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import {
  AddLineBar,
  Chip,
  EmptyState,
  FieldLabel,
  InitialsAvatar,
  LineNumber,
  ListToolbar,
  SectionTitle,
  tableHeadClass,
} from "@/components/manager/kit";
import { workspaceInnerPanelClass, workspacePanelClass } from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSalesAgents, updateSalesAgent, type UserData } from "@/lib/actions";
import { changePasswordWithConfirm } from "@/lib/validations";
import { cn } from "@/lib/utils";

type AgentLine = {
  id: string;
  full_name: string;
  password: string;
  confirm_password: string;
};

const LINE_TINTS = ["violet", "cyan", "pink", "emerald", "amber", "sky"] as const;
const newLineId = () => Math.random().toString(36).slice(2, 9);
const emptyLine = (): AgentLine => ({
  id: newLineId(),
  full_name: "",
  password: "",
  confirm_password: "",
});

export function CredentialManagementSection({
  passwordForm,
  pharmacists,
  loading,
  onDeleteUser,
  onChangePassword,
  onRefresh,
}: {
  passwordForm: UseFormReturn<z.infer<typeof changePasswordWithConfirm>>;
  pharmacists: UserData[];
  loading: boolean;
  onDeleteUser: (id: string) => void | Promise<void>;
  onChangePassword: (data: z.infer<typeof changePasswordWithConfirm>) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<AgentLine[]>(() => [emptyLine()]);
  // One username for the whole team: typed on a single "source" line, mirrored (locked) on the rest.
  const [batchUsername, setBatchUsername] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserData | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirm, setEditConfirm] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Once any agent exists, the team's username is saved and cannot be changed.
  const savedUsername = pharmacists[0]?.username ?? "";
  const shownUsername = savedUsername || batchUsername;
  const sourceIndex = lines.findIndex((l) => l.id === sourceId);

  const updateLine = (id: string, patch: Partial<AgentLine>) =>
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));

  const usernameEditable = (line: AgentLine) => !savedUsername && (!sourceId || sourceId === line.id);

  const changeUsername = (line: AgentLine, value: string) => {
    setBatchUsername(value);
    setSourceId(value ? line.id : null);
  };

  const removeLine = (id: string) =>
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((l) => l.id !== id);
      if (id === sourceId) setSourceId(batchUsername ? next[0].id : null);
      return next;
    });

  const passwordProblem = (line: AgentLine, index: number) =>
    line.password && lines.some((other, i) => i !== index && other.password === line.password)
      ? "Another agent in this batch uses the same password"
      : null;

  const saveAgents = async () => {
    const username = shownUsername.trim();
    if (!username) return toast.error("Enter the username your sales team will use to sign in");
    if (/\s/.test(username)) return toast.error("Username cannot contain spaces");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prefix = `Agent #${i + 1}`;
      if (!line.full_name.trim()) return toast.error(`${prefix}: Enter the full name`);
      if (line.password.length < 4) return toast.error(`${prefix}: Password must be at least 4 characters`);
      if (line.password !== line.confirm_password) return toast.error(`${prefix}: Passwords do not match`);
      const problem = passwordProblem(line, i);
      if (problem) return toast.error(`${prefix}: ${problem}`);
    }
    const result = await createSalesAgents(
      username,
      lines.map((line) => ({ full_name: line.full_name.trim(), password: line.password })),
      setSaving,
    );
    if (result) {
      setLines([emptyLine()]);
      setBatchUsername("");
      setSourceId(null);
      await onRefresh();
    }
  };

  // Passwords are stored hashed and can never be read back, so the dialog shows a masked
  // placeholder for the saved one. Leaving it untouched keeps the current password.
  const SAVED_PASSWORD = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";

  const openEdit = (user: UserData) => {
    setEditing(user);
    setEditName(user.full_name ?? "");
    setEditUsername(user.username);
    setEditPassword(SAVED_PASSWORD);
    setEditConfirm(SAVED_PASSWORD);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editName.trim()) return toast.error("Enter the full name");
    const newUsername = editUsername.trim();
    if (!newUsername) return toast.error("Enter the username");
    if (/\s/.test(newUsername)) return toast.error("Username cannot contain spaces");
    const changed = editPassword !== SAVED_PASSWORD || editConfirm !== SAVED_PASSWORD;
    if (changed) {
      if (editPassword.length < 4) return toast.error("Password must be at least 4 characters");
      if (editPassword !== editConfirm) return toast.error("Passwords do not match");
    }
    const result = await updateSalesAgent(editing.id, { full_name: editName.trim(), username: newUsername, password: changed ? editPassword : undefined }, setSavingEdit);
    if (result) {
      setEditing(null);
      await onRefresh();
    }
  };

  const filtered = pharmacists.filter((user) =>
    `${user.full_name ?? ""} ${user.username}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className={cn(workspacePanelClass, "overflow-hidden p-0")}>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionTitle
            icon={UserPlus}
            tint="violet"
            title="Create sales agents"
            subtitle="Add several agents at once. One shared username; each agent keeps their own password"
          />

          {savedUsername ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-3">
              <span className="tint-icon tint-cyan flex size-9 items-center justify-center rounded-xl">
                <Lock className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">
                  Sales username: <span className="font-mono text-cyan-100">@{savedUsername}</span>
                </p>
                <p className="text-xs text-white/65">
                  Every agent signs in with this username. Edit any agent below to change it for the whole team.
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {lines.map((line, index) => {
              const editable = usernameEditable(line);
              const pwProblem = passwordProblem(line, index);
              return (
                <div
                  key={line.id}
                  className={cn(workspaceInnerPanelClass, "space-y-4 p-5", `tint-${LINE_TINTS[index % LINE_TINTS.length]}`)}
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white/85">
                      <LineNumber index={index} />
                      Sales agent
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-white/60 hover:bg-rose-500/20 hover:text-rose-200"
                      disabled={lines.length === 1}
                      aria-label={`Remove agent ${index + 1}`}
                      onClick={() => removeLine(line.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <FieldLabel icon={IdCard} tone="violet">Full name</FieldLabel>
                      <div className="relative">
                        <IdCard className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-violet-300" />
                        <Input
                          value={line.full_name}
                          onChange={(e) => updateLine(line.id, { full_name: e.target.value })}
                          placeholder="e.g. Hana Tesfaye"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel icon={editable ? UserRound : Lock} tone="cyan">Username (shared)</FieldLabel>
                      <div className="relative">
                        {editable ? (
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-cyan-300" />
                        ) : (
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-white/45" />
                        )}
                        <Input
                          value={shownUsername}
                          onChange={(e) => changeUsername(line, e.target.value)}
                          disabled={!editable}
                          placeholder={editable ? "e.g. selam.sales" : ""}
                          autoComplete="off"
                          className={cn("h-11 pl-10", !editable && "cursor-not-allowed opacity-70")}
                        />
                      </div>
                      {!editable ? (
                        <p className="mt-1 text-xs text-white/55">
                          {savedUsername ? "Saved — change it from an agent's edit dialog" : `Set on agent #${sourceIndex + 1}. Edit it there.`}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <FieldLabel icon={KeyRound} tone="pink">Password</FieldLabel>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-pink-300" />
                        <Input
                          type="password"
                          value={line.password}
                          onChange={(e) => updateLine(line.id, { password: e.target.value })}
                          placeholder="At least 4 characters"
                          autoComplete="new-password"
                          className={cn("h-11 pl-10", pwProblem && "border-rose-400/70")}
                        />
                      </div>
                      {pwProblem ? <p className="mt-1 text-xs font-bold text-rose-300">Same password as another agent</p> : null}
                    </div>
                    <div>
                      <FieldLabel icon={ShieldCheck} tone="emerald">Confirm password</FieldLabel>
                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-emerald-300" />
                        <Input
                          type="password"
                          value={line.confirm_password}
                          onChange={(e) => updateLine(line.id, { confirm_password: e.target.value })}
                          placeholder="Repeat password"
                          autoComplete="new-password"
                          className={cn(
                            "h-11 pl-10",
                            line.confirm_password && line.confirm_password !== line.password && "border-rose-400/70",
                          )}
                        />
                      </div>
                      {line.confirm_password && line.confirm_password !== line.password ? (
                        <p className="mt-1 text-xs font-bold text-rose-300">Passwords do not match</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <AddLineBar label="Add another sales agent" onClick={() => setLines((prev) => [...prev, emptyLine()])} />

          <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            <p className="min-w-0 flex-1 basis-72 text-sm text-white/60">
              Each agent needs a password that no other sales agent uses.
            </p>
            <Button type="button" size="lg" className="ml-auto min-w-56" disabled={saving || loading} onClick={() => void saveAgents()}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {saving ? "Creating…" : `Create ${lines.length > 1 ? `${lines.length} sales agents` : "sales agent"}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(workspacePanelClass, "overflow-hidden p-0")}>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionTitle
            icon={Users}
            tint="cyan"
            title="Sales agents"
            subtitle={`Showing ${filtered.length} of ${pharmacists.length} · accounts in this pharmacy`}
          />
          <ListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search name or username…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={tableHeadClass}>Sales agent</TableHead>
                <TableHead className={tableHeadClass}>Username</TableHead>
                <TableHead className={tableHeadClass}>Role</TableHead>
                <TableHead className={cn(tableHeadClass, "text-right")}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={user.full_name || user.username} />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{user.full_name || "No full name yet"}</p>
                          <p className="text-xs text-white/50">Sales agent</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-white/85">
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="size-3 text-white/40" />@{user.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip seed={user.role || "pharmacist"} className="capitalize">{user.role}</Chip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Edit ${user.username}`}
                          title="Edit"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDeleteButton
                          title="Delete sales agent?"
                          description={`Delete ${user.full_name || user.username}. Their past sales stay in the reports under their name.`}
                          onConfirm={() => onDeleteUser(user.id)}
                          iconOnly
                          ariaLabel={`Delete ${user.username}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="p-4">
                    <EmptyState
                      icon={Users}
                      tint="cyan"
                      title={pharmacists.length ? "No agents match" : "No sales agents yet"}
                      description={pharmacists.length ? "Try a different search." : "Create your first sales agent above."}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={cn(workspacePanelClass, "overflow-hidden p-0")}>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionTitle
            icon={ShieldCheck}
            tint="emerald"
            title="Manager password"
            subtitle="Change the current manager password securely"
          />
          <form className="grid gap-4 md:grid-cols-3" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
            <CustomFormField
              name="old_password"
              control={passwordForm.control}
              fieldType={formFieldTypes.INPUT}
              label="Current password"
              placeholder="Enter current password"
              type="password"
            />
            <CustomFormField
              name="new_password"
              control={passwordForm.control}
              fieldType={formFieldTypes.INPUT}
              label="New password"
              placeholder="Enter new password"
              type="password"
            />
            <CustomFormField
              name="confirm_new_password"
              control={passwordForm.control}
              fieldType={formFieldTypes.INPUT}
              label="Confirm password"
              placeholder="Confirm new password"
              type="password"
            />
            <div className="flex justify-end md:col-span-3">
              <Button type="submit" size="lg" disabled={loading}>
                <KeyRound className="mr-1.5 h-4 w-4" />
                {loading ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && !savingEdit && setEditing(null)}>
        <DialogContent className="max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 font-display text-xl font-bold">
              <span className="tint-icon tint-violet flex size-9 items-center justify-center rounded-xl">
                <Pencil className="size-4" />
              </span>
              Edit sales agent
            </DialogTitle>
            <DialogDescription>Edit the name or team username. Type over the masked password to change it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <FieldLabel icon={IdCard} tone="violet">Full name</FieldLabel>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11" />
            </div>
            <div>
              <FieldLabel icon={Lock} tone="cyan">Username</FieldLabel>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value.replace(/\s/g, ""))} className="h-11 font-mono" autoComplete="off" />
              <p className="mt-1 text-xs text-white/50">Changing the username here changes it for every sales agent.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel icon={KeyRound} tone="pink">Password</FieldLabel>
                <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} onFocus={(e) => e.target.select()} placeholder="Password" autoComplete="new-password" className="h-11" />
                <p className="mt-1 text-xs text-white/50">Must be unique across the platform.</p>
              </div>
              <div>
                <FieldLabel icon={ShieldCheck} tone="emerald">Confirm password</FieldLabel>
                <Input type="password" value={editConfirm} onChange={(e) => setEditConfirm(e.target.value)} onFocus={(e) => e.target.select()} placeholder="Repeat password" autoComplete="new-password" className="h-11" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={savingEdit} onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="button" disabled={savingEdit} onClick={() => void saveEdit()}>
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
