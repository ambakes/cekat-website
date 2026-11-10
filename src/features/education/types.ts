export interface EducationChapter {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly points: readonly string[];
  readonly takeaway: string;
  readonly illustration?: { readonly src: string; readonly alt: string; readonly caption: string };
}
