from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import re
import fitz
from docx import Document


app = FastAPI(title="ContractGuard AI")


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://contract-guard-ai-lyart.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# UPLOAD DIRECTORY
# --------------------------------------------------

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# --------------------------------------------------
# COMPANY POLICIES
# --------------------------------------------------

POLICIES = [
    {
        "name": "Security Deposit",
        "category": "Financial",
        "type": "Numeric Range",
        "minimum": 50000,
        "maximum": 75000,
        "action": "Flag for Human Review",
    },
    {
        "name": "Notice Period",
        "category": "Termination",
        "type": "Numeric Range",
        "minimum": 30,
        "maximum": 60,
        "action": "Flag for Human Review",
    },
    {
        "name": "Maintenance Clause",
        "category": "Property",
        "type": "Required Clause",
        "action": "Flag for Human Review",
    },
    {
        "name": "Deposit Return Clause",
        "category": "Security Deposit",
        "type": "Required Clause",
        "action": "Flag for Human Review",
    },
    {
        "name": "Prohibited Clause",
        "category": "General",
        "type": "Prohibited Clause",
        "term": "automatic renewal without notice",
        "action": "Flag for Human Review",
    },
]


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "ContractGuard AI backend is running!"
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# --------------------------------------------------
# TEXT EXTRACTION
# --------------------------------------------------

def extract_text_from_file(file_path: Path):

    extension = file_path.suffix.lower()

    # PDF
    if extension == ".pdf":

        pages = []

        document = fitz.open(file_path)

        for page_number, page in enumerate(document, start=1):

            text = page.get_text()

            pages.append({
                "page": page_number,
                "text": text
            })

        document.close()

        full_text = "\n".join(
            page["text"] for page in pages
        )

        return full_text, pages

    # DOCX
    elif extension == ".docx":

        document = Document(file_path)

        paragraphs = []

        for paragraph in document.paragraphs:
            if paragraph.text.strip():
                paragraphs.append(paragraph.text)

        full_text = "\n".join(paragraphs)

        return full_text, [
            {
                "page": 1,
                "text": full_text
            }
        ]

    else:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )


# --------------------------------------------------
# UPLOAD CONTRACT
# --------------------------------------------------

@app.post("/upload-contract")
async def upload_contract(file: UploadFile = File(...)):

    extension = Path(file.filename).suffix.lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    content = await file.read()

    with open(file_path, "wb") as output:
        output.write(content)

    return {
        "message": "Contract uploaded successfully!",
        "filename": file.filename
    }


# --------------------------------------------------
# EXTRACT CONTRACT
# --------------------------------------------------

@app.post("/extract-contract")
async def extract_contract(file: UploadFile = File(...)):

    extension = Path(file.filename).suffix.lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    content = await file.read()

    with open(file_path, "wb") as output:
        output.write(content)

    full_text, pages = extract_text_from_file(file_path)

    return {
        "filename": file.filename,
        "full_text": full_text,
        "pages": pages
    }


# --------------------------------------------------
# NUMBER EXTRACTION
# --------------------------------------------------

def extract_amount(text):

    patterns = [
        r"₹\s*([\d,]+)",
        r"rs\.?\s*([\d,]+)",
        r"rs\s*([\d,]+)",
        r"([\d,]+)\s*(?:rupees|INR)"
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            value = match.group(1)

            value = value.replace(",", "")

            try:
                return int(value)
            except ValueError:
                pass

    return None


def extract_days(text):

    patterns = [
        r"(\d+)\s*days?",
        r"(\d+)\s*day"
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            try:
                return int(match.group(1))
            except ValueError:
                pass

    return None


# --------------------------------------------------
# FIND EVIDENCE
# --------------------------------------------------

def find_evidence(text, keywords):

    sentences = re.split(
        r"(?<=[.!?])\s+|\n+",
        text
    )

    for sentence in sentences:

        sentence_lower = sentence.lower()

        for keyword in keywords:

            if keyword.lower() in sentence_lower:

                return sentence.strip()

    return ""


# --------------------------------------------------
# ANALYZE CONTRACT
# --------------------------------------------------

@app.post("/analyze-contract")
async def analyze_contract(file: UploadFile = File(...)):

    extension = Path(file.filename).suffix.lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    content = await file.read()

    with open(file_path, "wb") as output:
        output.write(content)

    full_text, pages = extract_text_from_file(file_path)

    text_lower = full_text.lower()

    findings = []

    # ----------------------------------------------
    # SECURITY DEPOSIT
    # ----------------------------------------------

    deposit_keywords = [
        "security deposit",
        "deposit"
    ]

    deposit_evidence = find_evidence(
        full_text,
        deposit_keywords
    )

    deposit_value = extract_amount(
        deposit_evidence
    )

    if deposit_value is None:

        findings.append({
            "clause": "Security Deposit",
            "status": "MISSING",
            "risk": "HIGH",
            "value": None,
            "policy": "₹50,000 – ₹75,000",
            "evidence": "No security deposit amount was detected.",
            "reason": "The contract does not provide a detectable security deposit amount.",
            "action": "Flag for Human Review"
        })

    elif 50000 <= deposit_value <= 75000:

        findings.append({
            "clause": "Security Deposit",
            "status": "COMPLIANT",
            "risk": "LOW",
            "value": deposit_value,
            "policy": "₹50,000 – ₹75,000",
            "evidence": deposit_evidence,
            "reason": "The detected security deposit is within the approved policy range.",
            "action": "No immediate action"
        })

    else:

        findings.append({
            "clause": "Security Deposit",
            "status": "DEVIATION",
            "risk": "HIGH",
            "value": deposit_value,
            "policy": "₹50,000 – ₹75,000",
            "evidence": deposit_evidence,
            "reason": "The detected security deposit is outside the approved policy range.",
            "action": "Flag for Human Review"
        })

    # ----------------------------------------------
    # NOTICE PERIOD
    # ----------------------------------------------

    notice_evidence = find_evidence(
        full_text,
        [
            "notice period",
            "notice",
            "termination"
        ]
    )

    notice_days = extract_days(
        notice_evidence
    )

    if notice_days is None:

        findings.append({
            "clause": "Notice Period",
            "status": "MISSING",
            "risk": "HIGH",
            "value": None,
            "policy": "30 – 60 days",
            "evidence": "No notice period was detected.",
            "reason": "The contract does not provide a detectable notice period.",
            "action": "Flag for Human Review"
        })

    elif 30 <= notice_days <= 60:

        findings.append({
            "clause": "Notice Period",
            "status": "COMPLIANT",
            "risk": "LOW",
            "value": notice_days,
            "policy": "30 – 60 days",
            "evidence": notice_evidence,
            "reason": "The detected notice period is within the approved policy range.",
            "action": "No immediate action"
        })

    else:

        findings.append({
            "clause": "Notice Period",
            "status": "DEVIATION",
            "risk": "HIGH",
            "value": notice_days,
            "policy": "30 – 60 days",
            "evidence": notice_evidence,
            "reason": "The detected notice period is outside the approved policy range.",
            "action": "Flag for Human Review"
        })

    # ----------------------------------------------
    # MAINTENANCE CLAUSE
    # ----------------------------------------------

    maintenance_evidence = find_evidence(
        full_text,
        [
            "maintenance",
            "repairs",
            "maintenance responsibility"
        ]
    )

    if maintenance_evidence:

        findings.append({
            "clause": "Maintenance Clause",
            "status": "COMPLIANT",
            "risk": "LOW",
            "value": None,
            "policy": "Required clause",
            "evidence": maintenance_evidence,
            "reason": "A maintenance-related clause was detected in the contract.",
            "action": "No immediate action"
        })

    else:

        findings.append({
            "clause": "Maintenance Clause",
            "status": "MISSING",
            "risk": "MEDIUM",
            "value": None,
            "policy": "Required clause",
            "evidence": "No maintenance clause was detected.",
            "reason": "The required maintenance responsibility clause could not be found.",
            "action": "Flag for Human Review"
        })

    # ----------------------------------------------
    # DEPOSIT RETURN CLAUSE
    # ----------------------------------------------

    return_evidence = find_evidence(
        full_text,
        [
            "return the deposit",
            "deposit will be returned",
            "deposit shall be returned",
            "refund",
            "security deposit will be returned"
        ]
    )

    if return_evidence:

        findings.append({
            "clause": "Deposit Return Clause",
            "status": "COMPLIANT",
            "risk": "LOW",
            "value": None,
            "policy": "Conditions and timeline for returning deposit",
            "evidence": return_evidence,
            "reason": "The contract contains language describing return or refund of the deposit.",
            "action": "Review timeline and conditions"
        })

    else:

        findings.append({
            "clause": "Deposit Return Clause",
            "status": "MISSING",
            "risk": "MEDIUM",
            "value": None,
            "policy": "Conditions and timeline for returning deposit",
            "evidence": "No deposit return clause was detected.",
            "reason": "The required deposit return conditions and timeline could not be identified.",
            "action": "Flag for Human Review"
        })

    # ----------------------------------------------
    # PROHIBITED AUTOMATIC RENEWAL
    # ----------------------------------------------

    prohibited_term = "automatic renewal without notice"

    if prohibited_term in text_lower:

        evidence = find_evidence(
            full_text,
            ["automatic renewal without notice"]
        )

        findings.append({
            "clause": "Automatic Renewal",
            "status": "PROHIBITED",
            "risk": "HIGH",
            "value": None,
            "policy": "Prohibited: Automatic renewal without notice",
            "evidence": evidence,
            "reason": "The contract contains the prohibited automatic-renewal wording.",
            "action": "Flag for Human Review"
        })

    else:

        findings.append({
            "clause": "Automatic Renewal",
            "status": "COMPLIANT",
            "risk": "LOW",
            "value": None,
            "policy": "Prohibited: Automatic renewal without notice",
            "evidence": "The exact prohibited term was not detected.",
            "reason": "The specified prohibited wording was not found in the contract.",
            "action": "No immediate action"
        })

    # ----------------------------------------------
    # SUMMARY
    # ----------------------------------------------

    summary = {
        "total_rules_checked": len(findings),
        "compliant": sum(
            1 for item in findings
            if item["status"] == "COMPLIANT"
        ),
        "deviations": sum(
            1 for item in findings
            if item["status"] == "DEVIATION"
        ),
        "missing": sum(
            1 for item in findings
            if item["status"] == "MISSING"
        ),
        "prohibited": sum(
            1 for item in findings
            if item["status"] == "PROHIBITED"
        ),
        "unclear": sum(
            1 for item in findings
            if item["status"] == "UNCLEAR"
        )
    }

    human_review_required = any(
        item["status"] in [
            "DEVIATION",
            "MISSING",
            "PROHIBITED",
            "UNCLEAR"
        ]
        for item in findings
    )

    return {
        "filename": file.filename,
        "clauses": findings,
        "summary": summary,
        "human_review_required": human_review_required
    }


# --------------------------------------------------
# AI INVESTIGATION MODE
# --------------------------------------------------

@app.post("/investigate-contract")
async def investigate_contract(
    file: UploadFile = File(...)
):

    extension = Path(file.filename).suffix.lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    content = await file.read()

    with open(file_path, "wb") as output:
        output.write(content)

    full_text, pages = extract_text_from_file(
        file_path
    )

    text_lower = full_text.lower()

    investigations = []

    # ----------------------------------------------
    # INVESTIGATION 1
    # SECURITY DEPOSIT
    # ----------------------------------------------

    deposit_evidence = find_evidence(
        full_text,
        ["security deposit", "deposit"]
    )

    deposit_value = extract_amount(
        deposit_evidence
    )

    if deposit_value is not None:

        if 50000 <= deposit_value <= 75000:
            risk = "LOW"
            classification = "COMPLIANT"
            reason = (
                "The detected security deposit is "
                "within the company policy range."
            )
        else:
            risk = "HIGH"
            classification = "DEVIATION"
            reason = (
                "The detected security deposit is "
                "outside the company policy range."
            )

        investigations.append({
            "title": "Security Deposit Investigation",
            "contract_clause": deposit_evidence,
            "policy": (
                "Security Deposit must be between "
                "₹50,000 and ₹75,000."
            ),
            "evidence": deposit_evidence,
            "classification": classification,
            "risk": risk,
            "reason": reason,
            "recommended_action": "Flag for Human Review"
        })

    # ----------------------------------------------
    # INVESTIGATION 2
    # NOTICE PERIOD
    # ----------------------------------------------

    notice_evidence = find_evidence(
        full_text,
        ["notice period", "termination", "notice"]
    )

    notice_days = extract_days(
        notice_evidence
    )

    if notice_days is not None:

        if 30 <= notice_days <= 60:
            risk = "LOW"
            classification = "COMPLIANT"
            reason = (
                "The detected notice period is "
                "within the company policy range."
            )
        else:
            risk = "HIGH"
            classification = "DEVIATION"
            reason = (
                "The detected notice period is "
                "outside the company policy range."
            )

        investigations.append({
            "title": "Notice Period Investigation",
            "contract_clause": notice_evidence,
            "policy": (
                "Notice period must be between "
                "30 and 60 days."
            ),
            "evidence": notice_evidence,
            "classification": classification,
            "risk": risk,
            "reason": reason,
            "recommended_action": "Flag for Human Review"
        })

    # ----------------------------------------------
    # INVESTIGATION 3
    # DEPOSIT RETURN
    # ----------------------------------------------

    return_evidence = find_evidence(
        full_text,
        [
            "return the deposit",
            "deposit will be returned",
            "deposit shall be returned",
            "refund"
        ]
    )

    if return_evidence:

        investigations.append({
            "title": "Deposit Return Investigation",
            "contract_clause": return_evidence,
            "policy": (
                "The agreement must specify "
                "conditions and timeline for returning "
                "the security deposit."
            ),
            "evidence": return_evidence,
            "classification": "REVIEW",
            "risk": "MEDIUM",
            "reason": (
                "Deposit-return language was detected, "
                "but the reviewer should verify that "
                "both conditions and timeline are clearly specified."
            ),
            "recommended_action": "Review clause"
        })

    else:

        investigations.append({
            "title": "Deposit Return Investigation",
            "contract_clause": "No matching clause found.",
            "policy": (
                "The agreement must specify "
                "conditions and timeline for returning "
                "the security deposit."
            ),
            "evidence": "No supporting evidence found.",
            "classification": "MISSING",
            "risk": "MEDIUM",
            "reason": (
                "The required deposit-return clause "
                "could not be identified."
            ),
            "recommended_action": "Flag for Human Review"
        })

    # ----------------------------------------------
    # INVESTIGATION 4
    # AUTOMATIC RENEWAL
    # ----------------------------------------------

    if "automatic renewal without notice" in text_lower:

        evidence = find_evidence(
            full_text,
            ["automatic renewal without notice"]
        )

        investigations.append({
            "title": "Automatic Renewal Investigation",
            "contract_clause": evidence,
            "policy": (
                "Automatic renewal without notice "
                "is prohibited."
            ),
            "evidence": evidence,
            "classification": "PROHIBITED",
            "risk": "HIGH",
            "reason": (
                "The prohibited automatic-renewal "
                "wording was detected."
            ),
            "recommended_action": "Flag for Human Review"
        })

    else:

        investigations.append({
            "title": "Automatic Renewal Investigation",
            "contract_clause": "No prohibited wording detected.",
            "policy": (
                "Automatic renewal without notice "
                "is prohibited."
            ),
            "evidence": (
                "The specified prohibited wording "
                "was not found."
            ),
            "classification": "COMPLIANT",
            "risk": "LOW",
            "reason": (
                "The specified prohibited wording "
                "was not detected."
            ),
            "recommended_action": "No immediate action"
        })

    # ----------------------------------------------
    # FINAL INVESTIGATION RESPONSE
    # ----------------------------------------------

    high_risk_count = sum(
        1 for item in investigations
        if item["risk"] == "HIGH"
    )

    review_count = sum(
        1 for item in investigations
        if item["classification"]
        in ["DEVIATION", "MISSING", "PROHIBITED", "REVIEW"]
    )

    return {
        "filename": file.filename,
        "mode": "AI Investigation Mode",
        "description": (
            "Evidence-backed investigation connecting "
            "contract clauses with predefined company policies."
        ),
        "investigations": investigations,
        "summary": {
            "investigations_run": len(investigations),
            "high_risk": high_risk_count,
            "requires_review": review_count
        },
        "human_review_required": review_count > 0
    }