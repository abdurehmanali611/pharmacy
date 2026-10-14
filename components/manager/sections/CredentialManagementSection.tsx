"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { workspacePanelClass, WorkspaceModuleHeader } from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { changePasswordWithConfirm, pharmacistCredential } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { UserData } from "@/lib/actions";

export function CredentialManagementSection({
  credentialForm,
  passwordForm,
  pharmacists,
  loading,
  userToEdit,
  onSubmitCredential,
  onEditUser,
  onDeleteUser,
  onCancelEdit,
  onChangePassword,
}: {
  credentialForm: UseFormReturn<z.infer<typeof pharmacistCredential>>;
  passwordForm: UseFormReturn<z.infer<typeof changePasswordWithConfirm>>;
  pharmacists: UserData[];
  loading: boolean;
  userToEdit: UserData | null;
  onSubmitCredential: (data: z.infer<typeof pharmacistCredential>) => void | Promise<void>;
  onEditUser: (user: UserData) => void;
  onDeleteUser: (id: string) => void | Promise<void>;
  onCancelEdit: () => void;
  onChangePassword: (data: z.infer<typeof changePasswordWithConfirm>) => void | Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
        <Card className={cn(workspacePanelClass, "flex h-full flex-col overflow-hidden p-0")}>
          <WorkspaceModuleHeader
            kicker="Access"
            title="Pharmacist credentials"
            description="Create or update the pharmacist account for this pharmacy."
          />
          <CardContent className="flex flex-1 flex-col p-6">
            <form className="flex flex-1 flex-col gap-4" onSubmit={credentialForm.handleSubmit(onSubmitCredential)}>
              <CustomFormField
                name="username"
                control={credentialForm.control}
                fieldType={formFieldTypes.INPUT}
                label="Username"
                placeholder="Enter username"
              />
              <CustomFormField
                name="password"
                control={credentialForm.control}
                fieldType={formFieldTypes.INPUT}
                label="Password"
                placeholder="Enter password"
                type="password"
              />
              <CustomFormField
                name="confirm_password"
                control={credentialForm.control}
                fieldType={formFieldTypes.INPUT}
                label="Confirm password"
                placeholder="Repeat password"
                type="password"
              />
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                {userToEdit ? (
                  <Button type="button" variant="secondary" onClick={onCancelEdit}>
                    Cancel edit
                  </Button>
                ) : (
                  <div />
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : userToEdit ? "Update pharmacist" : "Create pharmacist"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className={cn(workspacePanelClass, "flex h-full flex-col overflow-hidden p-0")}>
          <WorkspaceModuleHeader
            kicker="Security"
            title="Manager password"
            description="Change the current manager password securely."
          />
          <CardContent className="flex flex-1 flex-col p-6">
            <form className="flex flex-1 flex-col gap-4" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
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
              <div className="mt-auto pt-2">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(workspacePanelClass, "overflow-hidden p-0")}>
        <WorkspaceModuleHeader
          kicker="Roster"
          title="Pharmacist roster"
          description="Current pharmacist account linked to this pharmacy."
        />
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pharmacists.length ? (
                pharmacists.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ConfirmDeleteButton
                          title="Delete pharmacist account?"
                          description={`Delete ${user.username}. You can create or assign another pharmacist later.`}
                          onConfirm={() => onDeleteUser(user.id)}
                          iconOnly
                          ariaLabel={`Delete ${user.username}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No pharmacist accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
