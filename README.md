# Agentic Ticket Generation (WhatsApp → IT Ticket)
TVS Credit Case Study — Round 2

Authors: Gauri Nigam, Anushka Rajput  
Team: The Sharmans

---

## 1. Overview
This project implements an agentic workflow that ingests customer messages from WhatsApp, normalizes the content, masks personally identifiable information (PII), extracts intent and entities, and applies an SLA-aware policy to decide whether to resolve in-chat, create a ticket automatically, or hand off to a human agent. Ticket status is mirrored back to WhatsApp to maintain a single conversational surface.

Key outcomes:
- Multimodal intake (text; voice/image attachments flagged for OCR/ASR processing)
- Privacy by design (redaction and reversible tokenization entry points)
- Lightweight NLU and policy engine with clear thresholds
- Ticket generation with priority/queue/SLA assignment
- Status mirroring in the same WhatsApp thread
- Clean, replaceable integrations for production hardening

---

## 2. Problem Statement and Scope
- Customers initiate support over WhatsApp using mixed formats and languages.
- Manual triage causes delays and missed SLAs.
- Lack of consistent PII handling increases risk.
- Agents need a minimal console to view and update ticket states when automation is not sufficient.

This repository provides a working pipeline from WhatsApp message to policy decision and ticket creation, including status updates in the original channel. The design keeps channel adapters, ITSM adapters, and NLU/ASR/OCR providers swappable.

---

## 3. Architecture and Flow

```mermaid
flowchart TB
  W["Webhook (idempotent)"]-->O["Orchestrator"]-->N["Normalize + PII"]-->I["Intent/Entities"]
  P{"Policy: Priority / Queue / SLA"}
  I-->P
  P--"Self-serve YES"-->R["Resolve in chat"]
  P--"Policy+conf. YES"-->T["Create ticket + queue"]
  P--"NO"-->H["Agent handoff"]
  R-->S["Status mirror + CSAT"]; T-->S; H-->S
