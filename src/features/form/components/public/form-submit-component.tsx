"use client";
import { useRef, useState } from "react";
import { FormBlockInstance } from "@/features/form/types";
import { Button } from "@/components/ui/button";
import { FormBlocks } from "@/features/form/lib/form-blocks";
import { toast } from "sonner";
import { useMutationSubmitResponse } from "../../hooks/use-form";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormSettings } from "@/generated/prisma/client";

type FormSubmitProps = {
  id: string;
  blocks: FormBlockInstance[];
  settings?: FormSettings | null;
};

const FormSubmitComponent = ({ id, blocks, settings }: FormSubmitProps) => {
  const submitResponse = useMutationSubmitResponse();

  const formVals = useRef<{ [key: string]: string }>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setSubmitted] = useState<boolean>(false);

  const showName = settings?.showName ?? true;
  const showEmail = settings?.showEmail ?? true;
  const showPhone = settings?.showPhone ?? true;
  const needLogin = settings?.needLogin ?? true;
  const finishMessage = settings?.finishMessage ?? "Obrigado por seu cadastro!";

  const [leadInfo, setLeadInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Validate all fields
  const validateFields = () => {
    const errors: { [key: string]: string } = {};

    // Validate lead info only if needLogin is enabled
    if (needLogin) {
      if (showName && !leadInfo.name.trim())
        errors["lead_name"] = "Nome é obrigatório";
      if (showEmail && !leadInfo.email.trim())
        errors["lead_email"] = "E-mail é obrigatório";
      if (showPhone && !leadInfo.phone.trim())
        errors["lead_phone"] = "Telefone é obrigatório";
    }

    blocks.forEach((block) => {
      if (!block.childblocks) return;
      block.childblocks?.forEach((childblock) => {
        const required = childblock.attributes?.required;
        const blockValue = formVals.current?.[childblock.id]?.trim();

        // Check if field is required and empty
        if (required && (!blockValue || blockValue.trim() === "")) {
          errors[childblock.id] = "Este campo é obrigatório";
        }
      });
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (key: string, value: string) => {
    formVals.current[key] = value;

    if (formErrors[key] && value?.trim() !== "") {
      setFormErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[key];
        return updatedErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      toast("Campos obrigatórios não preenchidos");
      return;
    }

    setIsLoading(true);
    const responseJson = JSON.stringify({
      ...formVals.current,
      ...(needLogin && {
        ...(showName && { user_name: leadInfo.name }),
        ...(showEmail && { user_email: leadInfo.email }),
        ...(showPhone && { user_phone: leadInfo.phone }),
      }),
    });
    submitResponse.mutate(
      { id, response: responseJson },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: () => {
          toast("Algo deu errado");
        },
      },
    );
  };

  const showLeadFields = needLogin && (showName || showEmail || showPhone);

  return (
    <div
      className="scrollbar w-full h-full
  overflow-y-auto pt-3 transition-all duration-300
  "
    >
      <div
        className="w-full h-full 
      max-w-[650px] mx-auto"
      >
        <div
          className="w-full relative 
          bg-transparent px-2
            flex flex-col 
            items-center 
            justify-start pt-1 
            pb-14"
        >
          <div
            className="w-full mb-3
             bg-foreground/10 bg-[url(/form-bg.jpg)] 
             bg-center bg-cover border shadow-sm 
             h-[135px] max-w-[768px]
          rounded-md px-1"
          />

          <div className="w-full h-auto">
            {isSubmitted ? (
              <Card
                className="w-full bg-foreground/10 border
               shadow-sm min-h-[120px] rounded-md p-0"
              >
                <CardContent className="px-2 pb-2">
                  <div className="py-4 px-3">
                    <h1 className="text-4xl font-normal">{finishMessage}</h1>
                    <p className="mt-2 mb-8 text-base">
                      Recebemos seu formulário
                    </p>
                    <a
                      href="#"
                      className="outline-none 
                      underline text-sm  text-blue-500"
                    >
                      Saiba mais
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              blocks.length > 0 && (
                <div className="flex flex-col w-full gap-4">
                  {showLeadFields && (
                    <Card className="w-full border-none shadow-none bg-foreground/10 px-4">
                      <CardContent className="p-0 flex flex-col gap-4">
                        {showName && (
                          <Field>
                            <FieldLabel htmlFor="lead_name">
                              Nome completo
                            </FieldLabel>
                            <Input
                              id="lead_name"
                              placeholder="Seu nome"
                              value={leadInfo.name}
                              onChange={(e) =>
                                setLeadInfo({
                                  ...leadInfo,
                                  name: e.target.value,
                                })
                              }
                            />
                            {formErrors["lead_name"] && (
                              <FieldError>{formErrors["lead_name"]}</FieldError>
                            )}
                          </Field>
                        )}
                        {showEmail && (
                          <Field>
                            <FieldLabel htmlFor="lead_email">E-mail</FieldLabel>
                            <Input
                              id="lead_email"
                              placeholder="seu@email.com"
                              type="email"
                              value={leadInfo.email}
                              onChange={(e) =>
                                setLeadInfo({
                                  ...leadInfo,
                                  email: e.target.value,
                                })
                              }
                            />
                            {formErrors["lead_email"] && (
                              <FieldError>
                                {formErrors["lead_email"]}
                              </FieldError>
                            )}
                          </Field>
                        )}
                        {showPhone && (
                          <Field>
                            <FieldLabel htmlFor="lead_phone">
                              Telefone
                            </FieldLabel>
                            <Input
                              id="lead_phone"
                              placeholder="(00) 00000-0000"
                              value={leadInfo.phone}
                              onChange={(e) =>
                                setLeadInfo({
                                  ...leadInfo,
                                  phone: e.target.value,
                                })
                              }
                            />
                            {formErrors["lead_phone"] && (
                              <FieldError>
                                {formErrors["lead_phone"]}
                              </FieldError>
                            )}
                          </Field>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {blocks.map((block) => {
                    const FormBlockComponent =
                      FormBlocks[block.blockType].formComponent;

                    return (
                      <FormBlockComponent
                        key={block.id}
                        blockInstance={block}
                        handleBlur={handleBlur}
                        formErrors={formErrors}
                      />
                    );
                  })}
                  <div className="w-full">
                    <Button
                      className="bg-primary"
                      disabled={isLoading}
                      onClick={handleSubmit}
                    >
                      {isLoading && (
                        <Spinner className="w-4 h-4 animate-spin" />
                      )}
                      Enviar
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSubmitComponent;
