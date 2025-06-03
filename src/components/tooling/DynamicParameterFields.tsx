
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

type ParameterField = {
  key: string;
  label: string;
  type: "number" | "text";
};

type ParamSchema = {
  fields: ParameterField[];
};

type DynamicParameterFieldsProps = {
  control: Control<any>;
  paramSchema: ParamSchema | null;
  params: Record<string, any>;
};

export function DynamicParameterFields({ control, paramSchema, params }: DynamicParameterFieldsProps) {
  if (!paramSchema || !paramSchema.fields) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tool Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paramSchema.fields.map((field) => (
          <FormField
            key={field.key}
            control={control}
            name={`params.${field.key}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    step={field.type === "number" ? "0.01" : undefined}
                    {...formField}
                    value={formField.value || ""}
                    onChange={(e) => {
                      const value = field.type === "number" ? 
                        (e.target.value === "" ? "" : Number(e.target.value)) : 
                        e.target.value;
                      formField.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
