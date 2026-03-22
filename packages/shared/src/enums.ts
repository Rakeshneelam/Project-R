// ─── Social Type ─────────────────────────────────────
export enum SocialType {
  INTROVERT = 'INTROVERT',
  EXTROVERT = 'EXTROVERT',
  AMBIVERT = 'AMBIVERT',
}

// ─── Communication Style ────────────────────────────
export enum CommunicationStyle {
  TEXT_FIRST = 'TEXT_FIRST',
  VOICE_FIRST = 'VOICE_FIRST',
  VIDEO_FIRST = 'VIDEO_FIRST',
  IN_PERSON_FIRST = 'IN_PERSON_FIRST',
}

// ─── Intent ─────────────────────────────────────────
export enum FriendIntent {
  CASUAL_FRIENDS = 'CASUAL_FRIENDS',
  CLOSE_FRIENDS = 'CLOSE_FRIENDS',
  ACTIVITY_BUDDY = 'ACTIVITY_BUDDY',
  ACCOUNTABILITY_BUDDY = 'ACCOUNTABILITY_BUDDY',
  STUDY_PARTNER = 'STUDY_PARTNER',
  WORK_PARTNER = 'WORK_PARTNER',
}

export enum DatingIntent {
  NOT_INTERESTED = 'NOT_INTERESTED',
  OPEN_TO_IT = 'OPEN_TO_IT',
  ACTIVELY_LOOKING = 'ACTIVELY_LOOKING',
}

// ─── Challenge ──────────────────────────────────────
export enum ChallengeType {
  PLATFORM_DAILY = 'PLATFORM_DAILY',
  COMMUNITY_DAILY = 'COMMUNITY_DAILY',
  COMMUNITY_WEEKLY = 'COMMUNITY_WEEKLY',
}

export enum SubmissionType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ART = 'ART',
  PROOF = 'PROOF',
}

// ─── Reactions ──────────────────────────────────────
export enum ReactionType {
  UPVOTE = 'UPVOTE',
  CREATIVE = 'CREATIVE',
  SUPPORTIVE = 'SUPPORTIVE',
  FUNNY = 'FUNNY',
  THOUGHTFUL = 'THOUGHTFUL',
}

// ─── Dating Stages ──────────────────────────────────
export enum DatingStage {
  MATCHED = 'MATCHED',
  TEXT_PHASE = 'TEXT_PHASE',
  CHECKPOINT = 'CHECKPOINT',
  VOICE_UNLOCKED = 'VOICE_UNLOCKED',
  MEET_SUGGESTED = 'MEET_SUGGESTED',
  POST_DATE = 'POST_DATE',
  CLOSED = 'CLOSED',
}

// ─── Verification ───────────────────────────────────
export enum VerificationStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// ─── Community ──────────────────────────────────────
export enum CommunityType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ANONYMOUS = 'ANONYMOUS',
  INVITE_ONLY = 'INVITE_ONLY',
}

export enum CommunityRole {
  MEMBER = 'MEMBER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

// ─── Moderation ─────────────────────────────────────
export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  FAKE_PROFILE = 'FAKE_PROFILE',
  SCAM = 'SCAM',
  UNDERAGE = 'UNDERAGE',
  HATE_SPEECH = 'HATE_SPEECH',
  SELF_HARM = 'SELF_HARM',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ReportTargetType {
  USER = 'USER',
  POST = 'POST',
  COMMENT = 'COMMENT',
  MESSAGE = 'MESSAGE',
  COMMUNITY = 'COMMUNITY',
  CHALLENGE_SUBMISSION = 'CHALLENGE_SUBMISSION',
}

// ─── Leaderboard ────────────────────────────────────
export enum LeaderboardPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

export enum LeaderboardCategory {
  MOST_CREATIVE = 'MOST_CREATIVE',
  MOST_SUPPORTIVE = 'MOST_SUPPORTIVE',
  MOST_CONSISTENT = 'MOST_CONSISTENT',
  CHALLENGE_CHAMPION = 'CHALLENGE_CHAMPION',
  FASTEST_RISING = 'FASTEST_RISING',
  COMMUNITY_HERO = 'COMMUNITY_HERO',
}

// ─── Notification ───────────────────────────────────
export enum NotificationType {
  CHALLENGE_REMINDER = 'CHALLENGE_REMINDER',
  CHALLENGE_RESULT = 'CHALLENGE_RESULT',
  LEADERBOARD_CHANGE = 'LEADERBOARD_CHANGE',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  DATING_STAGE_CHANGE = 'DATING_STAGE_CHANGE',
  DATING_NEW_MATCH = 'DATING_NEW_MATCH',
  COMMUNITY_INVITE = 'COMMUNITY_INVITE',
  NEW_MESSAGE = 'NEW_MESSAGE',
  BADGE_EARNED = 'BADGE_EARNED',
  REWARD_AVAILABLE = 'REWARD_AVAILABLE',
  STREAK_WARNING = 'STREAK_WARNING',
  REPORT_UPDATE = 'REPORT_UPDATE',
  SYSTEM = 'SYSTEM',
}

// ─── User Role ──────────────────────────────────────
export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// ─── Buddy Type ─────────────────────────────────────
export enum BuddyType {
  FRIEND = 'FRIEND',
  TRIO = 'TRIO',
  HOBBY_BUDDY = 'HOBBY_BUDDY',
  ACCOUNTABILITY_BUDDY = 'ACCOUNTABILITY_BUDDY',
  STUDY_PARTNER = 'STUDY_PARTNER',
  WORK_PARTNER = 'WORK_PARTNER',
  ACTIVITY_BUDDY = 'ACTIVITY_BUDDY',
}
