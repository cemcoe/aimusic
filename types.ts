export interface Song {
  id: string;
  title: string;
  abc: string;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}
