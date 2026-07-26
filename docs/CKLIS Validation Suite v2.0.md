# CKLIS Validation Suite

Version: 2.0.0

Status: Production

Purpose

This Validation Suite verifies that CKLIS behaves according to the
Project Charter, Constitution, Learning Science, Runtime,
CKMS, Learning Experience Specification (LES),
Educational Engines, Production Engine,
Quality Engine and Output Schema.

The objective is to verify that CKLIS produces
structured educational experiences rather than generic AI responses.

------------------------------------------------------------
VALIDATION METHOD

For every test:

Step 1
Provide the Test Request to CKLIS.

Step 2
Copy the complete CKLIS response.

Step 3
Provide BOTH the Test Request and the CKLIS response
to an independent AI evaluator.

Step 4
Use the Evaluation Prompt provided at the end
of this document.

The evaluator SHALL judge only the quality
of the generated response.

It SHALL NOT assume access to CKLIS internals.

------------------------------------------------------------
SECTION A
Learning Experience Specification (LES)

------------------------------------------------------------

TEST LES-001

Purpose

Minimal request.

Request

Teach me Python variables.

Expected

✓ Understands educational intent

✓ Infers missing optional values

✓ Does not ask unnecessary clarification questions

✓ Produces a complete educational response

------------------------------------------------------------

TEST LES-002

Purpose

Complete request.

Request

Educational Intent:
Learn Python Loops

Audience:
Absolute Beginner

Representation:
Lesson

Desired Output:
Interactive Lesson

Duration:
20 minutes

Expected

✓ Executes directly

✓ Uses supplied information

✓ Does not override user choices

------------------------------------------------------------

TEST LES-003

Purpose

Missing mandatory information.

Request

Representation:
Story

Expected

✓ Requests ONLY Educational Intent

✓ Does not ask unnecessary questions

------------------------------------------------------------

TEST LES-004

Purpose

Conflicting constraints.

Request

Educational Intent:
Learn Recursion

Desired Output:
Complete Course

Duration:
2 Minutes

Expected

✓ Detects conflict

✓ Requests clarification OR resolves conflict reasonably

------------------------------------------------------------
SECTION B
Runtime Validation

------------------------------------------------------------

TEST RUN-001

Purpose

Natural language interpretation.

Request

Teach me SQL JOINS.

Expected

✓ Correct educational intent

✓ Correct output

✓ Runtime defaults applied

------------------------------------------------------------

TEST RUN-002

Purpose

Fully specified request.

Expected

✓ Minimal inference

✓ No unnecessary assumptions

------------------------------------------------------------

TEST RUN-003

Purpose

Clarification behaviour.

Expected

✓ Only mandatory clarification

✓ Never requests optional information unnecessarily

------------------------------------------------------------
SECTION C
Misconception Engine

------------------------------------------------------------

TEST MIS-001

Topic

Pointers in C

Expected

✓ Common misconceptions identified

✓ Correction strategies provided

✓ Audience appropriate

------------------------------------------------------------

TEST MIS-002

Audience

Advanced C Developers

Expected

✓ Different misconceptions from beginners

------------------------------------------------------------
SECTION D
Mental Model Engine

------------------------------------------------------------

TEST MM-001

Topic

Recursion

Expected

✓ One strong conceptual model

✓ Simple analogy

✓ Supports misconception correction

------------------------------------------------------------

TEST MM-002

Topic

Database Indexing

Expected

✓ Practical mental model

✓ Easy visualization

------------------------------------------------------------
SECTION E
Scenario Intelligence Engine

------------------------------------------------------------

TEST SCN-001

Topic

Binary Search

Expected

✓ Realistic scenario

✓ Supports mental model

✓ Appropriate audience

------------------------------------------------------------

TEST SCN-002

Topic

REST APIs

Expected

✓ Practical scenario

✓ Reinforces concept

------------------------------------------------------------
SECTION F
Pattern Mapping Engine

------------------------------------------------------------

TEST PAT-001

Topic

Recursion

Expected

✓ General reusable rule

✓ Transferable knowledge

------------------------------------------------------------

TEST PAT-002

Topic

Object-Oriented Programming

Expected

✓ Identifies reusable design principles

------------------------------------------------------------
SECTION G
Episode Generation Engine

------------------------------------------------------------

TEST EPI-001

Topic

Linked Lists

Expected

✓ Progressive lesson

✓ Smooth transitions

✓ Objectives covered

✓ Exercises included

------------------------------------------------------------

TEST EPI-002

Topic

Sorting Algorithms

Expected

✓ Proper instructional sequencing

------------------------------------------------------------
SECTION H
Production Engine

------------------------------------------------------------

TEST PRO-001

Representation

Story

Expected

✓ Educational story

✓ Narrative structure

✓ Preserves instructional intent

------------------------------------------------------------

TEST PRO-002

Representation

Comic

Expected

✓ Sequential scenes

✓ Dialogue

✓ Educational flow

------------------------------------------------------------

TEST PRO-003

Representation

Slides

Expected

✓ One concept per slide

✓ Speaker notes

✓ Practice questions

------------------------------------------------------------

TEST PRO-004

Representation

Podcast

Expected

✓ Audio-friendly narration

✓ Conversational structure

------------------------------------------------------------

TEST PRO-005

Representation

Interactive Lesson

Expected

✓ Activities

✓ Questions

✓ Feedback

✓ Assessment

------------------------------------------------------------

TEST PRO-006

Representation

Blog

Expected

✓ Progressive explanation

✓ Readable structure

------------------------------------------------------------
SECTION I
Quality Engine

------------------------------------------------------------

TEST QUA-001

Purpose

Intentionally incomplete lesson.

Expected

✓ Quality Engine identifies missing objectives

✓ Reports deficiencies

------------------------------------------------------------

TEST QUA-002

Purpose

Incorrect audience adaptation.

Expected

✓ Quality Engine detects mismatch

------------------------------------------------------------

TEST QUA-003

Purpose

Broken instructional flow.

Expected

✓ Quality Engine rejects output

------------------------------------------------------------
SECTION J
Output Schema

------------------------------------------------------------

Verify every generated artifact contains:

✓ Learning Objectives

✓ Educational progression

✓ Appropriate examples

✓ Assessment

✓ Summary

✓ Educational completeness

------------------------------------------------------------
SECTION K
Representation Fidelity

------------------------------------------------------------

Generate ALL of the following using
the SAME Educational Intent.

Story

Comic

Slides

Podcast

Lesson

Blog

Expected

✓ Same learning objectives

✓ Same misconceptions

✓ Same mental model

✓ Same instructional progression

✓ Only presentation changes

------------------------------------------------------------
SECTION L
Regression Tests

------------------------------------------------------------

TEST REG-001

Python Variables

Absolute Beginners

1-minute Instagram Reel

Expected

✓ Strong hook

✓ Real-life analogy

✓ Progressive explanation

✓ Memorable ending

------------------------------------------------------------

TEST REG-002

Python Variables

Absolute Beginners

15-minute YouTube Video

Expected

✓ Multiple examples

✓ Exercises

✓ Quiz

✓ Summary

------------------------------------------------------------

TEST REG-003

Recursion

Java Developers

Blog

Expected

✓ Advanced explanation

✓ Best practices

✓ Common misconceptions

------------------------------------------------------------

TEST REG-004

SQL JOINS

College Students

Slides

Expected

✓ Visual explanation

✓ Progressive examples

✓ Speaker notes

------------------------------------------------------------

TEST REG-005

Git

Beginners

Interactive Lesson

Expected

✓ Activities

✓ Questions

✓ Feedback

✓ Assessment

------------------------------------------------------------
SECTION M
End-to-End Pipeline

------------------------------------------------------------

Verify the generated response demonstrates
a complete educational workflow.

Educational Intent

↓

Learning Objectives

↓

Misconception Handling

↓

Mental Model

↓

Scenario

↓

Pattern

↓

Teaching Episodes

↓

Production

↓

Assessment

↓

Summary

------------------------------------------------------------
SECTION N
Stress Tests

------------------------------------------------------------

Examples

✓ Very large topic

✓ Multiple topics

✓ Ambiguous request

✓ Conflicting requirements

✓ Expert audience

✓ Absolute beginner

✓ Accessibility requirements

✓ Short duration

✓ Unsupported representation

✓ Missing optional fields

------------------------------------------------------------
FINAL AI EVALUATION PROMPT

You are the CKLIS Independent Validation Engine.

You will receive:

1. A Validation Test Case.

2. The CKLIS response.

Evaluate the response strictly against the
requirements of the supplied test.

Do NOT judge writing style alone.

Evaluate whether the response follows
the CKLIS educational architecture.

For every applicable criterion provide:

PASS

PARTIAL

FAIL

For every failure explain:

• Why it failed

• Which CKLIS component is most likely responsible

Possible components:

• LES

• Runtime

• CKMS

• Misconception Engine

• Mental Model Engine

• Scenario Intelligence Engine

• Pattern Mapping Engine

• Episode Generation Engine

• Production Engine

• Quality Engine

• Output Schema

Finally provide:

Overall Score (/100)

Production Readiness

Critical Issues

Suggested Improvements

Do NOT rewrite the educational content unless
necessary to explain a failure.

------------------------------------------------------------
END OF CKLIS Validation Suite

Version: 2.0.0

Status: Production