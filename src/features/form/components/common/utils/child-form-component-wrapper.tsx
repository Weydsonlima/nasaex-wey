import { FormBlockInstance, HandleBlurFunc } from "@/features/form/types";
import { FormBlocks } from "@/features/form/lib/form-blocks";

export function ChildFormComponentWrapper({
  blockInstance,
  errorMessage,
  isError,
  handleBlur,
}: {
  blockInstance: FormBlockInstance;
  isError?: boolean;
  errorMessage?: string;
  handleBlur?: HandleBlurFunc;
}) {
  const FormComponent = FormBlocks[blockInstance.blockType]?.formComponent;
  if (!FormComponent) return null;

  return (
    <FormComponent
      blockInstance={blockInstance}
      isError={isError}
      errorMessage={errorMessage}
      handleBlur={handleBlur}
    />
  );
}
