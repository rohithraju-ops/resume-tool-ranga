#!/bin/bash

JD='We are hiring a Design Engineer to develop mechanical components and assemblies for industrial equipment. Responsibilities include creating 3D CAD models in SolidWorks, producing GD&T drawings, conducting tolerance stack-up analysis, performing FEA using ANSYS, and collaborating with manufacturing teams on DFM and DFA reviews. Requirements: Bachelors in Mechanical Engineering, 2+ years experience with SolidWorks, knowledge of GD&T (ASME Y14.5), familiarity with sheet metal and plastic part design, experience with BOM management and engineering change documentation. Preferred: ANSYS FEA, PFMEA, Lean Six Sigma, exposure to twin-sheet thermoforming.'

curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d "{\"jd_text\": \"$JD\"}" \
  | python3 -m json.tool