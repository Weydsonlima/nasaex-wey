import { FormBlocksType } from "@/features/form/types";
import { HeadingBlock } from "@/features/form/components/common/heading-block";
import { RowLayoutBlock } from "@/features/form/components/common/layouts/RowLayout";
import { ParagraphBlock } from "@/features/form/components/common/paragraph-block";
import { RadioSelectBlock } from "@/features/form/components/common/radio-select-block";
import { StarRatingBlock } from "@/features/form/components/common/star-rating-block";
import { TextAreaBlock } from "@/features/form/components/common/text-area-bock";
import { TextFieldBlock } from "@/features/form/components/common/text-field";

export const FormBlocks: FormBlocksType = {
  RowLayout: RowLayoutBlock,
  Heading: HeadingBlock,
  Paragraph: ParagraphBlock,
  TextField: TextFieldBlock,
  TextArea: TextAreaBlock,
  RadioSelect: RadioSelectBlock,
  StarRating: StarRatingBlock,
};
