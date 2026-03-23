# Smart Contract Security Skills — Category Index

This folder categorizes all smart contract security, auditing, and testing skills available in the project.

---

## Static Analysis
| Skill | Description |
|-------|-------------|
| `slither` | Slither static analyzer — detector categories, triage workflow, custom detectors, CI integration |
| `semgrep-solidity` | Semgrep custom pattern matching — taint tracking, community rulesets for Solidity security |

## Symbolic Execution & Formal Verification
| Skill | Description |
|-------|-------------|
| `mythril` | Mythril symbolic execution — deep vulnerability detection via multi-transaction analysis |
| `halmos` | Halmos symbolic testing for Foundry — mathematical property verification in Solidity |
| `certora` | Certora formal verification with CVL — write mathematical proofs for contract correctness (rules, invariants, ghosts) |

## Fuzz Testing
| Skill | Description |
|-------|-------------|
| `echidna` | Echidna property-based fuzzer — property mode, assertion mode, optimization mode, invariant testing |
| `evm-testing` | Comprehensive EVM testing patterns — unit, fuzz, invariant, integration testing |

## Vulnerability Detection & Audit
| Skill | Description |
|-------|-------------|
| `vulnhunter` | Security vulnerability detection and variant analysis — hunting dangerous APIs, footguns, and patterns |
| `code-recon` | Deep architectural context building for security audits — understanding contract interactions and risk surfaces |
| `solidity-security` | Comprehensive Solidity security patterns — reentrancy, access control, overflow, OWASP top 10 for smart contracts |

## Secure Development Patterns
| Skill | Description |
|-------|-------------|
| `openzeppelin` | OpenZeppelin Contracts v5 — battle-tested, audited implementations for tokens, access control, upgrades |
| `eip-reference` | EIP/ERC standards — understanding spec compliance to avoid non-standard implementations |

---

## How to Use These Skills

### Pre-Development (Design Phase)
1. **`solidity-security`** — Review known vulnerability classes before writing code
2. **`openzeppelin`** — Use audited building blocks instead of rolling your own
3. **`eip-reference`** — Ensure spec compliance

### During Development (Continuous Testing)
4. **`evm-testing`** — Write unit + fuzz + invariant tests
5. **`echidna`** — Property-based fuzzing to find edge cases
6. **`halmos`** — Symbolic tests for mathematical guarantees

### Pre-Audit (Static Analysis)
7. **`slither`** — Run static analysis, triage findings
8. **`semgrep-solidity`** — Custom pattern scanning
9. **`mythril`** — Deep symbolic execution for multi-tx vulnerabilities

### Audit & Review
10. **`code-recon`** — Build architectural context for review
11. **`vulnhunter`** — Hunt for specific vulnerability variants
12. **`certora`** — Formal verification proofs for critical invariants

---

## Quick Reference: Tool Selection

| I want to... | Use |
|--------------|-----|
| Find common bugs fast | `slither` |
| Fuzz for edge cases | `echidna` |
| Prove a property mathematically | `certora` or `halmos` |
| Deep multi-tx vulnerability scan | `mythril` |
| Hunt specific vulnerability patterns | `vulnhunter` |
| Understand attack surface | `code-recon` |
| Custom pattern matching | `semgrep-solidity` |
| Learn secure Solidity patterns | `solidity-security` |
