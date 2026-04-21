from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
app = FastAPI(title="Resume Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import json
import os
import gspread
from google.oauth2.service_account import Credentials

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

with open(os.path.join(DATA_DIR, "profile.json")) as f:
    PROFILE = json.load(f)

# Google Sheets setup
GSHEET_CREDS_PATH = "/Users/r0ebot/Documents/autoapply-agent/data/google_credentials.json"
GSHEET_ID = "17rTFTMo-HEQGe4J6LxC1sAyR2E0EgKIu_zoVBNH2WEs"

try:
    _scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    _creds = Credentials.from_service_account_file(GSHEET_CREDS_PATH, scopes=_scopes)
    _gc = gspread.authorize(_creds)
    GSHEET = _gc.open_by_key(GSHEET_ID).sheet1
except Exception as e:
    print(f"⚠️ Google Sheets not available: {e}")
    GSHEET = None

import re
from typing import List

def extract_keywords(text: str) -> List[str]:
    """Extract meaningful keywords from raw JD text."""
    # Flatten all skills from profile
    profile_skills = [
        skill.lower() 
        for category in PROFILE["skills"].values() 
        for skill in category
    ]
    
    text_lower = text.lower()
    matched = [skill for skill in profile_skills if skill in text_lower]
    missing = [skill for skill in profile_skills if skill not in text_lower]
    
    return {
        "matched": matched,
        "missing": missing,
        "total": len(profile_skills),
        "match_count": len(matched)
    }

def log_to_sheet(company: str, role: str, resume_file: str, cover_letter_file: str, pre_score: int, post_score: int):
    """Log application to Google Sheet."""
    if not GSHEET:
        return
    try:
        from datetime import date
        row = [
            date.today().strftime("%B %d, %Y"),
            company,
            role,
            resume_file,
            cover_letter_file,
            pre_score,
            post_score,
            "Applied"
        ]
        GSHEET.append_row(row)
    except Exception as e:
        print(f"⚠️ Sheet log failed: {e}")

def score_projects(jd_text: str) -> List[dict]:
    """Score each project in profile against the JD."""
    jd_lower = jd_text.lower()
    scored = []

    for project in PROFILE["projects"]:
        score = 0
        tech_list = [t.lower() for t in project["tech"]]
        
        # Score based on tech stack matches
        tech_matches = [t for t in tech_list if t in jd_lower]
        score += len(tech_matches) * 10
        
        # Score based on keywords in description
        desc_text = project.get("description", "") or project.get("impact", "") or ""
        desc_words = set(re.findall(r'\b\w{4,}\b', desc_text.lower()))
        jd_words = set(re.findall(r'\b\w{4,}\b', jd_lower))
        desc_overlap = desc_words & jd_words
        score += len(desc_overlap) * 2

        scored.append({
            "name": project["name"],
            "tech": project["tech"],
            "score": score,
            "tech_matches": tech_matches,
        })

    return sorted(scored, key=lambda x: x["score"], reverse=True)

from pypdf import PdfReader

def compile_resume(tex_path: str, pdf_path: str) -> bool:
    """
    Compile LaTeX to PDF with progressive compression until it fits 1 page.
    Tunes font size, line spread, section spacing, project separator, and item spacing.
    Returns True if a level fit, False if none did.
    """

    # Read the injected template once
    with open(tex_path) as f:
        base_content = f.read()

   # Prefer dropping font size over crushing spacing — crushed 10pt looks worse than comfortable 9pt.
    # Each level: (font_pt, linespread, projsep, secbefore, secafter, itemsep)
    levels = [
        (10, "1.00", "3pt", "3pt", "2pt", "0pt"),   # generous default
        (10, "0.98", "3pt", "3pt", "2pt", "0pt"),   # -2% line height, still roomy
        (10, "0.96", "2pt", "3pt", "2pt", "0pt"),   # -4% line height
        (10, "0.94", "2pt", "2pt", "1pt", "0pt"),   # visible but acceptable
        ( 9, "1.00", "3pt", "3pt", "2pt", "0pt"),   # drop font, restore spacing ← new sweet spot
        ( 9, "0.97", "2pt", "3pt", "2pt", "0pt"),   # 9pt with mild compression
        ( 9, "0.94", "1pt", "2pt", "1pt", "0pt"),   # 9pt compressed
        ( 8, "1.00", "2pt", "2pt", "1pt", "0pt"),   # 8pt last resort with spacing
        ( 8, "0.95", "0pt", "1pt", "1pt", "0pt"),   # absolute last resort
    ]

    for idx, (font, spread, projsep, secbefore, secafter, itemsep) in enumerate(levels):
        content = base_content

        # Set font size in documentclass (works because we use extarticle, not article)
        content = re.sub(
            r'\\documentclass\[[^\]]*,[\d.]+pt\]\{ext?article\}',
            f'\\\\documentclass[a4paper,{font}pt]{{extarticle}}',
            content
        )

        # Fill compression knobs
        content = content.replace("XLINESPREADX", spread)
        content = content.replace("XPROJSEPX", projsep)
        content = content.replace("XSECBEFOREX", secbefore)
        content = content.replace("XSECAFTERX", secafter)
        content = content.replace("XITEMSEPX", itemsep)

        with open(tex_path, "w") as f:
            f.write(content)

        result = subprocess.run(
            ["tectonic", "--outdir", os.path.dirname(tex_path), tex_path],
            capture_output=True, text=True, cwd=os.path.dirname(tex_path)
        )

        if result.returncode != 0:
            print(f"⚠️ tectonic failed at level {idx}: {result.stderr[:300]}")
            continue

        pages = len(PdfReader(pdf_path).pages)
        print(f"📄 Level {idx}: font={font}pt, spread={spread}, projsep={projsep} → {pages} page(s)")

        if pages <= 1:
            if os.path.exists(tex_path):
                os.remove(tex_path)
            return True

    # Nothing fit — leave tex file for debugging
    return False

from fastapi import HTTPException
from pydantic import BaseModel

class JDRequest(BaseModel):
    jd_text: str

@app.post("/analyze")
async def analyze_jd(request: JDRequest):
    """Keyword analysis + project scoring — called before generation."""
    if not request.jd_text.strip():
        raise HTTPException(status_code=400, detail="JD text cannot be empty")
    
    keywords = extract_keywords(request.jd_text)
    projects = score_projects(request.jd_text)
    
    return {
        "keywords": keywords,
        "projects": projects
    }

from openai import OpenAI
import subprocess
import uuid
from datetime import datetime

@app.post("/generate")
async def generate(request: JDRequest):
    """Generate tailored resume + cover letter PDFs."""
    if not request.jd_text.strip():
        raise HTTPException(status_code=400, detail="JD text cannot be empty")

    import traceback

    job_id = f"manual_{uuid.uuid4().hex[:8]}"
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY")
    )

    # Load prompts
    with open(os.path.join(PROMPTS_DIR, "resume_tailor.txt")) as f:
        resume_prompt = f.read()

    # Tailor resume via Claude Sonnet
    resume_response = client.chat.completions.create(
        model="anthropic/claude-sonnet-4-5",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": f"{resume_prompt}\n\nJob Description:\n{request.jd_text}\n\nProfile:\n{json.dumps(PROFILE, indent=2)}"
        }]
    )

    tailored = resume_response.choices[0].message.content


    # Load and inject into LaTeX template
    with open(os.path.join(DATA_DIR, "resume_template.tex")) as f:
        template = f.read()

    def sanitize(text: str) -> str:
        return text.replace("&", "\\&").replace("%", "\\%").replace("$", "\\$").replace("#", "\\#")

    # Parse Claude's JSON response
    import re
    
    json_match = re.search(r'\{.*\}', tailored, re.DOTALL)
    if not json_match:
        raise HTTPException(status_code=500, detail="Claude did not return valid JSON")
    
    raw_json = json_match.group()
    try:
        tailored_data = json.loads(raw_json)
    except json.JSONDecodeError:
        # Claude sometimes pre-escapes LaTeX chars (\%, \&, \$, \#, \_) inside JSON,
        # which is invalid JSON. Strip those backslashes so parsing succeeds.
        # escape_latex_specials will re-add them properly for LaTeX output.
        cleaned = re.sub(r'(?<!\\)\\([%&$#_])', r'\1', raw_json)
        try:
            tailored_data = json.loads(cleaned)
            print("⚠️ Recovered from invalid JSON escapes (Claude pre-escaped LaTeX chars)")
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"JSON parse failed even after cleanup: {e}")

    import re as _re

    def escape_latex_specials(text: str) -> str:
        """Escape unescaped & and % in LaTeX block content."""
        text = _re.sub(r'(?<!\\)&', r'\\&', text)
        text = _re.sub(r'(?<!\\)%', r'\\%', text)
        return text

    block_fields = ["skills_block", "exp_1_bullets", "exp_2_bullets", "exp_3_bullets",
                    "project_1_block", "project_2_block", "project_3_block", "project_4_block", "project_5_block"]

    def inject_template(td):
        t = open(os.path.join(DATA_DIR, "resume_template.tex")).read()
        t = t.replace("SUMMARY\\_PLACEHOLDER", sanitize(td.get("summary", "")))
        t = t.replace("SKILLS\\_BLOCK\\_PLACEHOLDER", td.get("skills_block", ""))
        t = t.replace("EXP\\_1\\_BULLETS\\_PLACEHOLDER", td.get("exp_1_bullets", ""))
        t = t.replace("EXP\\_2\\_BULLETS\\_PLACEHOLDER", td.get("exp_2_bullets", ""))
        t = t.replace("EXP\\_3\\_BULLETS\\_PLACEHOLDER", td.get("exp_3_bullets", ""))
        for i in range(1, 6):
            t = t.replace(f"PROJECT\\_{i}\\_BLOCK", td.get(f"project_{i}_block", ""))
        return t

    def collapse_item_lines(text: str) -> str:
        lines = text.split('\n')
        result = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('\\item') or stripped.startswith('\\noindent') or stripped.startswith('\\begin') or stripped.startswith('\\end'):
                result.append(line)
            elif result and stripped and not stripped.startswith('\\'):
                result[-1] = result[-1].rstrip() + ' ' + stripped
        return '\n'.join(result)

    for field in block_fields:
        if field in tailored_data:
            tailored_data[field] = tailored_data[field].replace('\\n\\n', '\\n')
            tailored_data[field] = re.sub(r'\\n(?!\w)', '\n', tailored_data[field])
            tailored_data[field] = escape_latex_specials(tailored_data[field])
            tailored_data[field] = re.sub(r'(?<!\\n)(\\item)', r'\n\1', tailored_data[field])
            tailored_data[field] = re.sub(r'\n{2,}', '\n', tailored_data[field])
            tailored_data[field] = re.sub(r'\n\s+\n', '\n', tailored_data[field])
            tailored_data[field] = collapse_item_lines(tailored_data[field])
            tailored_data[field] = tailored_data[field].strip()

    print("DEBUG tailored_data:", json.dumps(tailored_data, indent=2))
    template = inject_template(tailored_data)

    # Extract company + role using Haiku
    try:
        extract_response = client.chat.completions.create(
            model="anthropic/claude-sonnet-4-5",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": f"Extract the company name and job title from this job description. Respond with only JSON like {{\"company\": \"...\", \"role\": \"...\"}}. JD: {request.jd_text[:1000]}"
            }]
        )

        import json as _json
        import re as _re
        raw = extract_response.choices[0].message.content
        json_match2 = _re.search(r'\{.*\}', raw, _re.DOTALL)
        if json_match2:
            extracted = _json.loads(json_match2.group())
            company = extracted.get("company") or "Unknown"
            role = extracted.get("role") or "Unknown"
        else:
            company = "Unknown"
            role = "Unknown"
            
    except Exception as e:
        print(f"⚠️ Extraction failed: {e}")
        company = "Unknown"
        role = "Unknown"


    safe_company = company.replace(" ", "_").replace("/", "-")
    safe_role = role.replace(" ", "_").replace("/", "-")
    resume_filename = f"Rangarajan_Resume_{safe_company}_{safe_role}.pdf"
    cover_letter_filename = f"Rangarajan_CoverLetter_{safe_company}_{safe_role}.pdf"

    # Write and compile
    tex_path = os.path.join(OUTPUT_DIR, f"Rangarajan_Resume_{safe_company}_{safe_role}.tex")
    pdf_path = os.path.join(OUTPUT_DIR, f"Rangarajan_Resume_{safe_company}_{safe_role}.pdf")

    # Inject flat keys Claude returns directly into template

    # Write injected template to disk, then compile with progressive compression
    with open(tex_path, "w") as f:
        f.write(template)

    print("DEBUG tailored_data:", json.dumps(tailored_data, indent=2))

    try:
        compiled = compile_resume(tex_path, pdf_path)
    except HTTPException:
        raise
    except Exception as e:
        print("COMPILE EXCEPTION:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

    if not compiled:
        raise HTTPException(
            status_code=500,
            detail="Could not fit resume to one page even at max compression (font=8pt, spread=0.95). Content is genuinely too long — trim a project or shorten bullets."
        )
        
    # Load cover letter prompt
    with open(os.path.join(PROMPTS_DIR, "cover_letter.txt")) as f:
        cl_prompt = f.read()

    # Generate cover letter via Claude Sonnet
    cl_response = client.chat.completions.create(
        model="anthropic/claude-sonnet-4-5",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": f"{cl_prompt}\n\nJob Description:\n{request.jd_text}\n\nTailored Resume Content:\n{json.dumps(tailored_data, indent=2)}"
        }]
    )

    cl_text = cl_response.choices[0].message.content

    # Generate cover letter PDF via LaTeX
    with open(os.path.join(DATA_DIR, "cover_letter_template.tex")) as f:
        cl_template = f.read()

    # Convert plain text to LaTeX paragraphs
    from datetime import date
    today = date.today().strftime("%B %d, %Y")
    import re
    
    cl_text = re.sub(r'^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}.*$', 
                     '[Today\'s Date]', cl_text, flags=re.IGNORECASE|re.MULTILINE)
    cl_text = cl_text.replace("[Today's Date]", today)
    cl_paragraphs = "\n\n".join(
        line.strip() for line in cl_text.strip().split("\n") if line.strip()
    )
    
    cl_template = cl_template.replace("COVER\\_LETTER\\_BODY", sanitize(cl_paragraphs))

    cl_tex_path = os.path.join(OUTPUT_DIR, f"Rangarajan_CoverLetter_{safe_company}_{safe_role}.tex")
    cl_pdf_path = os.path.join(OUTPUT_DIR, f"Rangarajan_CoverLetter_{safe_company}_{safe_role}.pdf")

    with open(cl_tex_path, "w") as f:
        f.write(cl_template)

    cl_result = subprocess.run(
        ["tectonic", "--outdir", OUTPUT_DIR, cl_tex_path],
        capture_output=True, text=True, cwd=OUTPUT_DIR
    )

    if os.path.exists(cl_tex_path):
        os.remove(cl_tex_path)

    if cl_result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Cover letter tectonic failed: {cl_result.stderr}")

    # Post-tailoring keyword score
    tailored_text = json.dumps(tailored_data)
    post_keywords = extract_keywords(tailored_text)
    
    raw_profile_text = " ".join([
        " ".join([skill for category in PROFILE["skills"].values() for skill in category]),
        " ".join([p.get("description","") or p.get("impact","") for p in PROFILE["projects"]])
    ])
    pre_keywords = extract_keywords(request.jd_text)

    # Log to Google Sheet
    log_to_sheet(
        company=company,
        role=role,
        resume_file=f"resume_{job_id}.pdf",
        cover_letter_file=f"cover_letter_{job_id}.pdf",
        pre_score=pre_keywords["match_count"],
        post_score=post_keywords["match_count"]
    )

    return {
        "job_id": job_id,
        "resume_pdf": resume_filename,
        "cover_letter_pdf": cover_letter_filename,
        "pre_score": {
            "matched": pre_keywords["match_count"],
            "total": pre_keywords["total"]
        },
        "post_score": {
            "matched": post_keywords["match_count"],
            "total": post_keywords["total"]
        },
        "post_matched_keywords": post_keywords["matched"]
    }

from fastapi.responses import FileResponse

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Serve generated PDF files."""
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security check — prevent directory traversal
    if not os.path.abspath(file_path).startswith(os.path.abspath(OUTPUT_DIR)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )