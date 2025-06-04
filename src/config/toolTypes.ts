
export const TOOL_TYPES_CONFIG = {
  "Conventional Lathe": [
    {
      name: "Turning Insert",
      param_schema: {
        fields: [
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "corner_radius", label: "Corner Radius (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Facing Insert",
      param_schema: {
        fields: [
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "cutting_edge_length", label: "Cutting Edge Length (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Boring Bar",
      param_schema: {
        fields: [
          { key: "bar_diameter", label: "Bar Diameter (mm)", type: "number" },
          { key: "tool_length", label: "Tool Length (mm)", type: "number" },
          { key: "shank_diameter", label: "Shank Diameter (mm)", type: "number" }
        ]
      }
    },
    {
      name: "Parting Tool",
      param_schema: {
        fields: [
          { key: "tool_width", label: "Tool Width (mm)", type: "number" },
          { key: "cutting_depth", label: "Cutting Depth (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Threading Insert",
      param_schema: {
        fields: [
          { key: "thread_pitch", label: "Thread Pitch (mm)", type: "number" },
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Grooving Tool",
      param_schema: {
        fields: [
          { key: "groove_width", label: "Groove Width (mm)", type: "number" },
          { key: "groove_depth", label: "Groove Depth (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ],
  "CNC Lathe (Turning Center)": [
    {
      name: "Turning Insert",
      param_schema: {
        fields: [
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "corner_radius", label: "Corner Radius (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Facing Insert",
      param_schema: {
        fields: [
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "cutting_edge_length", label: "Cutting Edge Length (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Boring Bar",
      param_schema: {
        fields: [
          { key: "bar_diameter", label: "Bar Diameter (mm)", type: "number" },
          { key: "tool_length", label: "Tool Length (mm)", type: "number" },
          { key: "shank_diameter", label: "Shank Diameter (mm)", type: "number" }
        ]
      }
    },
    {
      name: "Parting Tool",
      param_schema: {
        fields: [
          { key: "tool_width", label: "Tool Width (mm)", type: "number" },
          { key: "cutting_depth", label: "Cutting Depth (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Threading Insert",
      param_schema: {
        fields: [
          { key: "thread_pitch", label: "Thread Pitch (mm)", type: "number" },
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Grooving Tool",
      param_schema: {
        fields: [
          { key: "groove_width", label: "Groove Width (mm)", type: "number" },
          { key: "groove_depth", label: "Groove Depth (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Live-Tool Drill Bit",
      param_schema: {
        fields: [
          { key: "drill_diameter", label: "Drill Diameter (mm)", type: "number" },
          { key: "flute_length", label: "Flute Length (mm)", type: "number" },
          { key: "point_angle", label: "Point Angle (degrees)", type: "number" }
        ]
      }
    },
    {
      name: "Live-Tool Milling Cutter",
      param_schema: {
        fields: [
          { key: "cutter_diameter", label: "Cutter Diameter (mm)", type: "number" },
          { key: "flute_count", label: "Flute Count", type: "number" },
          { key: "length", label: "Length (mm)", type: "number" }
        ]
      }
    }
  ],
  "Swiss-Type Lathe": [
    {
      name: "Swiss Turning Insert",
      param_schema: {
        fields: [
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "corner_radius", label: "Corner Radius (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Swiss Boring Bar",
      param_schema: {
        fields: [
          { key: "bar_diameter", label: "Bar Diameter (mm)", type: "number" },
          { key: "tool_length", label: "Tool Length (mm)", type: "number" },
          { key: "shank_diameter", label: "Shank Diameter (mm)", type: "number" }
        ]
      }
    },
    {
      name: "Swiss Parting Tool",
      param_schema: {
        fields: [
          { key: "tool_width", label: "Tool Width (mm)", type: "number" },
          { key: "cutting_depth", label: "Cutting Depth (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Swiss Threading Insert",
      param_schema: {
        fields: [
          { key: "thread_pitch", label: "Thread Pitch (mm)", type: "number" },
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ],
  "Vertical Milling Machine": [
    {
      name: "Endmill",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "cutting_length", label: "Cutting Length (mm)", type: "number" },
          { key: "flute_count", label: "Flute Count", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Face Mill",
      param_schema: {
        fields: [
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "cutter_diameter", label: "Cutter Diameter (mm)", type: "number" },
          { key: "number_of_inserts", label: "Number of Inserts", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Ball Nose Endmill",
      param_schema: {
        fields: [
          { key: "ball_diameter", label: "Ball Diameter (mm)", type: "number" },
          { key: "cutting_length", label: "Cutting Length (mm)", type: "number" },
          { key: "flute_count", label: "Flute Count", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Drill Bit",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "flute_length", label: "Flute Length (mm)", type: "number" },
          { key: "point_angle", label: "Point Angle (degrees)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ],
  "CNC Milling Center (3-axis)": [
    {
      name: "Endmill",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "cutting_length", label: "Cutting Length (mm)", type: "number" },
          { key: "flute_count", label: "Flute Count", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Face Mill",
      param_schema: {
        fields: [
          { key: "insert_diameter", label: "Insert Diameter (mm)", type: "number" },
          { key: "cutter_diameter", label: "Cutter Diameter (mm)", type: "number" },
          { key: "number_of_inserts", label: "Number of Inserts", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Ball Nose Endmill",
      param_schema: {
        fields: [
          { key: "ball_diameter", label: "Ball Diameter (mm)", type: "number" },
          { key: "cutting_length", label: "Cutting Length (mm)", type: "number" },
          { key: "flute_count", label: "Flute Count", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Drill Bit",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "flute_length", label: "Flute Length (mm)", type: "number" },
          { key: "point_angle", label: "Point Angle (degrees)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ],
  "Drill Press (Bench or Floor)": [
    {
      name: "Twist Drill",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "flute_length", label: "Flute Length (mm)", type: "number" },
          { key: "point_angle", label: "Point Angle (degrees)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Center Drill",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "overall_length", label: "Overall Length (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "Countersink",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "angle", label: "Angle (degrees)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ],
  "Surface Grinder": [
    {
      name: "Grinding Wheel (Aluminum Oxide)",
      param_schema: {
        fields: [
          { key: "wheel_diameter", label: "Wheel Diameter (mm)", type: "number" },
          { key: "wheel_thickness", label: "Wheel Thickness (mm)", type: "number" },
          { key: "grit_size", label: "Grit Size", type: "number" }
        ]
      }
    },
    {
      name: "Diamond Dressing Tool",
      param_schema: {
        fields: [
          { key: "diamond_grit_size", label: "Diamond Grit Size", type: "number" },
          { key: "tool_diameter", label: "Tool Diameter (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ],
  "Wire EDM": [
    {
      name: "Brass Wire",
      param_schema: {
        fields: [
          { key: "wire_diameter", label: "Wire Diameter (mm)", type: "number" },
          { key: "wire_material", label: "Wire Material", type: "text" },
          { key: "wire_tension", label: "Wire Tension (N)", type: "number" }
        ]
      }
    }
  ],
  "Laser Cutting Machine": [
    {
      name: "Laser Cutting Nozzle",
      param_schema: {
        fields: [
          { key: "nozzle_diameter", label: "Nozzle Diameter (mm)", type: "number" },
          { key: "orifice_size", label: "Orifice Size (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ],
  "CNC Router": [
    {
      name: "Straight Flute Endmill (Plastic/Wood)",
      param_schema: {
        fields: [
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "cutting_length", label: "Cutting Length (mm)", type: "number" },
          { key: "flute_count", label: "Flute Count", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    },
    {
      name: "V-Bit",
      param_schema: {
        fields: [
          { key: "tip_angle", label: "Tip Angle (degrees)", type: "number" },
          { key: "diameter", label: "Diameter (mm)", type: "number" },
          { key: "material", label: "Material", type: "text" }
        ]
      }
    }
  ]
};

// Simplified version for common machine types - you can expand this as needed
export const getToolTypesForMachine = (machineType: string) => {
  return TOOL_TYPES_CONFIG[machineType as keyof typeof TOOL_TYPES_CONFIG] || [];
};
