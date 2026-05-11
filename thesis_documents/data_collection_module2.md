# 3.7.2 Data Collection for SWAFO Web Application

The data collection for the SWAFO Web Application centers on the digitization and systematic encoding of the institutional policies, student records, and enforcement operations that govern the disciplinary process at De La Salle University, Dasmarinas. The primary source document for this module is the DLSU-D Student Handbook (SY 2023-2027), specifically Section 27 (Code of Conduct), Section 26 (Discipline Procedure), Section 14 (Student Clearance), Section 1.6 (Uniform and Dress Code Policy), and Section 1.7 (Identification Card Policy). These sections collectively define the offense taxonomy, sanction structures, escalation logic, and clearance requirements that the system must faithfully represent.

The SWAFO Web Application requires an exhaustive digital representation of the university's offense classification system to serve as the rule engine behind its violation recording, assessment, and escalation features. The Student Handbook classifies offenses into three primary categories: Minor Offenses (Section 27.1), Major Offenses (Section 27.3), and Traffic-Related Offenses (Section 27.4). The system encodes all 82 rules from these sections into a structured database, where each entry contains a unique rule code, its full textual description, its parent category, and the prescribed penalty for the first through fifth occurrence of that offense.

## 3.7.2.1 Minor Offenses (Section 27.1)

Minor offenses are grouped into nine subcategories covering behavioral, dress code, identification, and other campus conduct violations. The following table presents a summary of the minor offense subcategories and the number of individual rules under each.

Table X: Summary of Minor Offense Subcategories (Section 27.1)

| Section Code | Subcategory | Number of Rules |
|---|---|---|
| 27.1.1 | Behavior Unbecoming of a Young Christian Adult | 7 |
| 27.1.2 | Wearing of Prohibited Clothes / Improper Uniform / Dress Code | 11 |
| 27.1.3 | Improper or Unauthorized Use of Classroom and Equipment | 1 |
| 27.1.4 | Non-Wearing of School ID | 1 |
| 27.1.5 | Violation of Class Policies and Procedures | 1 |
| 27.1.6 | Exposed Body Piercing / Improper Earrings | 1 |
| 27.1.7 | Proselytizing | 1 |
| 27.1.8 | Unauthorized Posting or Removal of Materials | 1 |
| 27.1.9 | Cross-Dressing Without Approval | 1 |

Among these, Section 27.1.2 (Prohibited Clothing) is the direct integration point between Module 1 and Module 2. When the AI detection system at the campus gates identifies a dress code violation such as see-through clothes (27.1.2.1), ripped jeans exposing skin above the knee (27.1.2.2), sleeveless blouses (27.1.2.4), crop tops (27.1.2.9), or slippers (27.1.2.11), the recorded infraction is transmitted to Module 2 for formal encoding under this subcategory.

Minor offenses follow a frequency-based escalation scheme defined in the handbook. The system collects and tracks the number of times a student has committed the same type of minor offense and applies the following sanction progression.

Table X: Minor Offenses Frequency and Sanction Progression

| Frequency | Sanction Imposed |
|---|---|
| 1st offense | Written warning with verbal advice |
| 2nd offense | First minor offense on record |
| 3rd offense | Second minor offense on record |
| 4th offense | Third minor offense, treated as equivalent to a major offense |

This escalation is significant because the fourth minor offense of the same nature triggers an automatic elevation to a major offense under Section 27.3.1.43 (Commission of Third Minor Offense). The system's assessment engine actively monitors this threshold and alerts the officer when a student has reached it.

## 3.7.2.2 Major Offenses (Section 27.3)

Major offenses are subdivided into three categories: Misconduct (Section 27.3.1), Dishonesty (Section 27.3.2), and Violent Acts (Section 27.3.3). The system encodes a total of 56 major offense rules across these three subcategories. Each offense has its own prescribed sanction tier for successive occurrences, with sanction severity progressing from probation to expulsion depending on the rule and the frequency of the violation. The following table presents the breakdown of each subcategory and the thematic groupings of the offenses they contain.

Table X: Summary of Major Offense Subcategories and Coverage (Section 27.3)

| Section Code | Subcategory | Number of Rules | Coverage |
|---|---|---|---|
| 27.3.1 | Misconduct | 43 | IT/Computer misuse, drug-related offenses, social and behavioral violations, criminal conviction, and programmatic escalation triggers. |
| 27.3.2 | Dishonesty | 8 | Document tampering, ID misuse, false statements, theft, gross dishonesty, cheating, and plagiarism. |
| 27.3.3 | Violent Acts | 5 | Fraternity/sorority violations, unrecognized recruitment, hazing, threats, and physical assault. |

The sanction codes referenced by each offense's penalty tier are defined by the handbook as follows.

Table X: Definition of Major Offense Sanction Codes

| Sanction Code | Name | Description |
|---|---|---|
| 1 | Probation (1 Year) | Student permitted to continue education under behavioral observation |
| 2 | Suspension (3-5 School Days) | Temporary denial from attending classes for 3 to 5 days |
| 3 | Suspension (6-12 School Days) | Extended suspension for 6 to 12 days |
| 4 | Non-Readmission | Denied enrollment for the term following the decision |
| 5 | Exclusion | Name dropped from the roll of students immediately |
| 6 | Expulsion | Disqualified from admission to any HEI in the Philippines (per MORPHE 2008) |

An additional policy stipulated under Section 27.3.4 states that the SWAFO Director may prescribe an Alternative Sanction in lieu of suspension at the Director's discretion. The system accommodates this by allowing the Director to render a custom sanction and provide written remarks during the adjudication phase.

A critical rule that the system must enforce is Section 27.3.5, which states that when a student commits a second through fourth major offense of a different nature from a previous major offense, the sanction is no longer determined by the offense's own frequency table but is instead decided by the SWAFO Director. The system detects this cross-category condition by comparing the rule code of the new offense against all prior major offenses on the student's record. If the codes differ, the system flags the case as requiring Director referral and disables the automated sanction recommendation.

Two rules within the Misconduct subcategory serve as programmatic escalation triggers: Section 27.3.1.39 (Habitual Commission of Minor Offenses of the Same Nature) and Section 27.3.1.43 (Commission of Third Minor Offense). These are not manually filed by an officer but are automatically triggered by the assessment engine when the student's minor offense count under the same rule code meets the defined threshold. All students who commit major offenses are required to undergo the Formation Program (Section 26.4) after serving their sanction, and completion of this program is a prerequisite for obtaining a Certificate of Good Moral Character.

## 3.7.2.3 Traffic-Related Offenses (Section 27.4)

Traffic-related offenses operate under a separate classification with their own escalation counters, independent of the general minor and major offense frequency tables. These offenses are primarily monitored by the General Services Office (GSO) and coordinated with SWAFO and the Accounting Office for resolution and fine collection. The following table presents the breakdown of traffic offense tiers encoded in the system.

Table X: Summary of Traffic-Related Offense Tiers (Section 27.4)

| Section Code | Traffic Tier | Number of Rules | Coverage |
|---|---|---|---|
| 27.4.2 | Minor Traffic Violations | 6 | Inappropriate horn use, illegal parking, driving without seatbelt, disturbing vehicle alarm, overloading, heavily tinted vehicle |
| 27.4.3 | Major Traffic Violations | 13 | Driving without license, reckless driving, DUI, fake/movable car sticker, obscene sticker, no plate number, loud muffler, smoke belching, over speeding, idling, disregarding road signs, traffic obstruction |

Minor traffic violations follow their own escalation table: a warning on the first offense, a minor offense on record with a Php 1,000 fine on the second, a second minor offense with a Php 2,000 fine on the third, and cancellation of the vehicle pass on the fourth. Notably, the second through fourth minor traffic offenses feed into the general minor offense counter under Section 27.1, meaning they can contribute toward triggering the Section 27.3.1.43 major offense escalation.

A critical distinction in the handbook is the treatment of the first major traffic offense. The first occurrence results in a "major administrative sanction" with a Php 2,000 fine, but this does not enter the student's formal discipline record. It is only the second major traffic offense that formally enters the discipline record as a major offense, triggers the Formation Program, and activates Section 27.3.5 cross-checking if other major offenses exist on the student's record. The system's assessment engine tracks this distinction by maintaining a separate counter for traffic offenses.

## 3.7.2.4 Student Identity and User Data

The system collects user identity data through two distinct authentication mechanisms depending on the user's role. Students access the system through Microsoft Authentication Library (MSAL) Single Sign-On using their institutional email accounts (@dlsud.edu.ph). Upon a successful OAuth handshake, the system retrieves the student's verified email address and resolves it to a local User record, which is linked via a one-to-one foreign key to their StudentProfile containing their 9-digit Student Number, enrolled course, year level, and clearance status.

Officers and the Director (Admin) are provisioned with dedicated pre-registered accounts on the system. These accounts are created by the system administrator and authenticated using token-based credentials (Django SimpleJWT). Unlike student accounts, officer and director accounts do not pass through the Microsoft SSO flow. Instead, they log in directly with their assigned credentials, which grants them access to the Officer Portal or Admin Portal depending on their assigned role. The system currently maintains 4 officer accounts and 1 director account.

During violation recording, a student's identity can also be resolved through a physical barcode scan of their institutional ID card using the web-based barcode scanner. The scanned value is matched against the StudentProfile database through an exact-match query on the Student Number field, instantly retrieving the student's full demographic profile without manual entry.

## 3.7.2.5 Violation Event Data

Each violation recording event captures the identified student, the recording officer, the cited handbook rule, a written description, photographic evidence, and the timestamp and location of the incident (selected from a normalized dataset of 52 campus buildings). Before formal recording, the system's Assessment Engine executes a duplicate detection check within a 24-hour window and queries the student's violation history to determine the appropriate recommended penalty tier and escalation flags.

## 3.7.2.6 Patrol and Geolocation Data

Campus patrol sessions generate spatial and temporal data documenting officer enforcement coverage. The system continuously collects geolocation coordinates from the officer's mobile device, accumulating a trail of GPS breadcrumbs filtered for jitter. Furthermore, proximity checkpoint data is automatically logged using the Haversine formula whenever an officer enters within 30 meters of a designated campus building. Photographs captured during a patrol undergo client-side forensic watermarking, embedding the GPS coordinates, location name, and capture timestamp directly into the image before transmission.
