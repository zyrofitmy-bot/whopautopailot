# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Actively supported |

## Reporting a Vulnerability

We take the security of OrganicFlow seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Instead, please email us or use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity within 5 business days
- **Fix**: Critical vulnerabilities will be patched as soon as possible
- **Disclosure**: We will coordinate with you on the timing of public disclosure

### Security Best Practices

This project implements the following security measures:

- **Row Level Security (RLS)** on all database tables via Supabase
- **JWT-based authentication** for all API calls
- **Server-side validation** in Edge Functions for sensitive operations
- **Atomic wallet operations** to prevent race conditions and double-spending
- **Environment variable protection** — no secrets are committed to the repository
- **Input sanitization** on all user-facing forms

## Scope

This security policy applies to the OrganicFlow codebase and its official deployments. Third-party dependencies are managed via npm and should be regularly audited using `npm audit`.

---

Thank you for helping keep OrganicFlow and our users safe! 🔒
