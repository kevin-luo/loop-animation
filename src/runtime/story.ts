import type { TimelineStep } from './animation';
import type { AppLanguage } from './i18n';

export interface StoryChapterCopy {
  label: string;
  title: string;
  summary: string;
  details: string;
  key: string;
}

export interface StoryChapter extends StoryChapterCopy {
  id: string;
  start: number;
  end: number;
}

export interface StoryManifest {
  schemaVersion: 1;
  language: AppLanguage;
  duration: number;
  topic: {
    title: string;
    lead: string;
  };
  chapters: StoryChapter[];
}

export interface BuildStoryManifestOptions {
  language: AppLanguage;
  duration: number;
  topicTitle: string;
  topicLead: string;
  steps: readonly TimelineStep[];
  chapters: readonly StoryChapterCopy[];
}

export function buildStoryManifest(options: BuildStoryManifestOptions): StoryManifest {
  return {
    schemaVersion: 1,
    language: options.language,
    duration: options.duration,
    topic: {
      title: options.topicTitle,
      lead: options.topicLead,
    },
    chapters: options.steps.map((step, index) => {
      const copy = options.chapters[index];
      return {
        id: step.id,
        start: step.start,
        end: step.end,
        label: copy?.label ?? step.id,
        title: copy?.title ?? step.id,
        summary: copy?.summary ?? '',
        details: copy?.details ?? '',
        key: copy?.key ?? '',
      };
    }),
  };
}
