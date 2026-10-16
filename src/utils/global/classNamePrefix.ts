// MUI computes its utility class names (e.g. "Badge-invisible") when its modules load, and its styles
// select on them. The prefix must therefore be configured before any other MUI module is imported:
// import this file first in every content script that renders MUI components.
import { unstable_ClassNameGenerator as ClassNameGenerator } from "@mui/material/className";

import { PROJECT_PREFIX } from "./var";

ClassNameGenerator.configure((componentName) => `${PROJECT_PREFIX}${componentName.replace("Mui", "")}`);
