
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MACHINE_TYPES = [
  "Conventional Lathe",
  "CNC Lathe (Turning Center)",
  "Swiss-Type Lathe",
  "Turret Lathe",
  "Vertical Turret Lathe (VTL)",
  "Vertical Milling Machine",
  "Horizontal Milling Machine",
  "CNC Milling Center (3-axis)",
  "CNC Milling Center (4-axis)",
  "CNC Milling Center (5-axis)",
  "Bed-Type Milling Machine",
  "Knee-Type Milling Machine",
  "Gantry (Bridge) Milling Machine",
  "Drill Press (Bench or Floor)",
  "Radial Arm Drill (Radial Drill)",
  "CNC Drill/Tap Center",
  "Horizontal Boring Mill",
  "Vertical Boring Mill",
  "CNC Boring Machine",
  "Surface Grinder",
  "Cylindrical Grinder (OD Grinder)",
  "Internal Grinder (ID Grinder)",
  "Centerless Grinder",
  "Tool & Cutter Grinder",
  "Creep Feed Grinder",
  "Wire EDM (Electrical Discharge Machine)",
  "Sinker (Ram) EDM",
  "Broaching Machine",
  "Honing Machine",
  "Lapping Machine",
  "Laser Cutting Machine",
  "Waterjet Cutting Machine",
  "Plasma Cutting Machine",
  "Ultrasonic Machining Center",
  "Electrochemical Machining (ECM) Machine",
  "CNC Router",
  "Additive/Subtractive Hybrid Machining Center",
  "3D Printer (for prototyping)",
  "CNC Router (Wood/Composite)",
  "CNC Laser Engraver",
];

type MachineTypeSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
};

export function MachineTypeSelect({ value, onValueChange, placeholder = "Select machine type" }: MachineTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {MACHINE_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { MACHINE_TYPES };
