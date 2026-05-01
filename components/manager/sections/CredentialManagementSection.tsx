"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { changePasswordWithConfirm, login } from "@/lib/validations";
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
  credentialForm: UseFormReturn<z.infer<typeof login>>;
  passwordForm: UseFormReturn<z.infer<typeof changePasswordWithConfirm>>;
  pharmacists: UserData[];
  loading: boolean;
  userToEdit: UserData | null;
  onSubmitCredential: (data: z.infer<typeof login>) => void | Promise<void>;
  onEditUser: (user: UserData) => void;
  onDeleteUser: (id: string) => void | Promise<void>;
  onCancelEdit: () => void;
  onChangePassword: (data: z.infer<typeof changePasswordWithConfirm>) => void | Promise<void>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Card className="rounded-3xl p-6">
          <CardHeader>
            <CardTitle>Pharmacist credentials</CardTitle>
            <CardDescription>Create or update the pharmacist account for this pharmacy.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={credentialForm.handleSubmit(onSubmitCredential)}>
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
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : userToEdit ? "Update pharmacist" : "Create pharmacist"}
                </Button>
                {userToEdit ? (
                  <Button type="button" variant="secondary" onClick={onCancelEdit}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl p-6">
          <CardHeader>
            <CardTitle>Manager password</CardTitle>
            <CardDescription>Change the current manager password securely.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
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
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>Pharmacist roster</CardTitle>
          <CardDescription>Current pharmacist account linked to this pharmacy.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pharmacists.length ? (
                pharmacists.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEditUser(user)}>
                        Edit
                      </Button>
                      <ConfirmDeleteButton
                        title="Delete pharmacist account?"
                        description={`Delete ${user.username}. You can create or assign another pharmacist later.`}
                        onConfirm={() => onDeleteUser(user.id)}
                      />
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
