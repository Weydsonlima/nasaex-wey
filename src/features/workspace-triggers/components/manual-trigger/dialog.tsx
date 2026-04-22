"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

export const wsManualTriggerSchema = z.object({
  actionId: z.string().optional(),
});

export type WsManualTriggerFormValues = z.infer<typeof wsManualTriggerSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WsManualTriggerFormValues) => void;
  defaultValues?: Partial<WsManualTriggerFormValues>;
}

export const WsManualTriggerDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: Props) => {
  const form = useForm<WsManualTriggerFormValues>({
    resolver: zodResolver(wsManualTriggerSchema),
    defaultValues: defaultValues ?? {},
  });

  const handleSubmit = (v: WsManualTriggerFormValues) => {
    onSubmit(v);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gatilho manual</DialogTitle>
          <DialogDescription>
            Opcional: informe o ID de uma ação para executar manualmente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="actionId"
              render={({ field }) => (
                <Field>
                  <FieldLabel>ID da ação (opcional)</FieldLabel>
                  <Input {...field} value={field.value ?? ""} />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
