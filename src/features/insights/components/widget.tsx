import { Card } from "@/components/ui/card";
import { useQueryListWidgets, useQueryWidgetByTag } from "../hooks/use-widget";
import { AddWidgetPerson } from "./add-widget-person";
import { Spinner } from "@/components/ui/spinner";

interface WidgetListProps {
  organizationId: string[];
}

export function WidgetList(data: WidgetListProps) {
  const { widgets } = useQueryListWidgets({
    organizationId: data.organizationId,
  });
  const widgetsSorted = widgets.sort((a, b) => a.order - b.order);
  return (
    <Card className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full min-h-40 px-4 ">
        {widgetsSorted.map((widget) => {
          const config =
            typeof widget.config === "string"
              ? JSON.parse(widget.config)
              : widget.config;

          return (
            <div key={widget.id}>
              {widget.type === "LEADS_BY_TAG" && (
                <WidgetTag
                  title={widget.title}
                  tagId={config?.tagid}
                  organizationId={widget.organizationId}
                />
              )}
            </div>
          );
        })}
        <AddWidgetPerson lastWidgetOrder={widgetsSorted.length} />
      </div>
    </Card>
  );
}

interface WidgetTagProps {
  title: string;
  tagId: string;
  organizationId: string;
}

function WidgetTag({ title, tagId, organizationId }: WidgetTagProps) {
  const { data, isLoading } = useQueryWidgetByTag({ tagId, organizationId });

  return (
    <Card className="w-full px-4 flex flex-col h-full items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-center">{title}</h1>
        {isLoading ? (
          <Spinner className="size-10" />
        ) : (
          <p
            className="text-2xl font-bold"
            style={{ color: data?.color ?? "#000" }}
          >
            {data?.count ?? 0}
          </p>
        )}
      </div>
    </Card>
  );
}
