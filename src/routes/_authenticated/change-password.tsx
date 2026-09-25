import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { fail } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/change-password")({
  component: ChangePassword,
});

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return fail("New passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current });
    setBusy(false);
    if (error) return fail(error.message);
    toast.success("Password updated");
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <Card className="mx-auto max-w-md rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Update the password used to sign in to your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cur">Current password</Label>
            <Input id="cur" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conf">Confirm new password</Label>
            <Input
              id="conf"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={busy}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
