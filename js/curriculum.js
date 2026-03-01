/**
 * curriculum.js — Load and index curriculum.json.
 * Provides lookup by track ID, lesson ID, challenge ID.
 */

let _data = null;

// Indexes built on load
const _tracks      = new Map();  // trackId → track
const _lessons     = new Map();  // lessonId → lesson
const _challenges  = new Map();  // challengeId → challenge

export async function init() {
  if (_data) return;
  const res = await fetch('data/curriculum.json');
  _data = await res.json();

  for (const track of _data.tracks) {
    _tracks.set(track.id, track);
    for (const lesson of track.lessons ?? []) {
      _lessons.set(lesson.id, { ...lesson, trackId: track.id, executor: track.executor });
      for (const ch of lesson.challenges ?? []) {
        _challenges.set(ch.id, { ...ch, lessonId: lesson.id, trackId: track.id, executor: track.executor });
      }
    }
  }
}

export function allTracks() {
  return _data?.tracks ?? [];
}

export function getTrack(id) {
  return _tracks.get(id);
}

export function getLesson(id) {
  return _lessons.get(id);
}

export function getChallenge(id) {
  return _challenges.get(id);
}

/** All lessons for a track, in order */
export function lessonsForTrack(trackId) {
  return getTrack(trackId)?.lessons ?? [];
}

/** All challenges for a lesson */
export function challengesForLesson(lessonId) {
  return getLesson(lessonId)?.challenges ?? [];
}

/**
 * Returns the next unlocked/available lesson for a track,
 * or null if all are complete.
 */
export function nextLesson(trackId, completedLessonIds) {
  const lessons = lessonsForTrack(trackId);
  return lessons.find(l => !completedLessonIds.includes(l.id)) ?? null;
}
