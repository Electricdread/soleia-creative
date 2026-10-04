import { describe, expect, it } from 'vitest';
import { downloadName, isViewable, mediaKind, mediaKindLabel, previewImageUrl, storedItemType, uploadKind } from './sessionMedia';

const base = 'https://x.supabase.co/storage/v1/object/public/creative-uploads/s/1';

describe('mediaKind', () => {
  it('reads an uploaded .html stored as a link as html', () => {
    expect(mediaKind({ item_type: 'link', file_url: `${base}.html` })).toBe('html');
    expect(mediaKind({ item_type: 'link', file_url: `${base}.HTM?v=2` })).toBe('html');
  });

  it('leaves a pasted link a link, even one that points at a .html page', () => {
    expect(mediaKind({ item_type: 'link', url: 'https://example.com/deck.html', file_url: null })).toBe('link');
  });

  it('passes the other types through', () => {
    expect(mediaKind({ item_type: 'pdf', file_url: `${base}.pdf` })).toBe('pdf');
    expect(mediaKind({ item_type: 'video', file_url: `${base}.mp4` })).toBe('video');
  });
});

describe('uploadKind and storedItemType', () => {
  it('classifies by type, then by extension', () => {
    expect(uploadKind({ name: 'Deck.PDF', type: '' })).toBe('pdf');
    expect(uploadKind({ name: 'pitch.html', type: 'text/html' })).toBe('html');
    expect(uploadKind({ name: 'pitch.htm', type: '' })).toBe('html');
    expect(uploadKind({ name: 'a.mp4', type: 'video/mp4' })).toBe('video');
    expect(uploadKind({ name: 'a.png', type: 'image/png' })).toBe('image');
    expect(uploadKind({ name: 'a.zip', type: 'application/zip' })).toBeNull();
  });

  it('stores html under a type the database accepts', () => {
    expect(storedItemType('html')).toBe('link');
    expect(storedItemType('pdf')).toBe('pdf');
  });
});

describe('previewImageUrl', () => {
  it('never hands a pdf or html file to an img', () => {
    expect(previewImageUrl({ item_type: 'pdf', file_url: `${base}.pdf` })).toBeNull();
    expect(previewImageUrl({ item_type: 'link', file_url: `${base}.html` })).toBeNull();
  });

  it('uses the stored thumbnail when there is one', () => {
    expect(previewImageUrl({ item_type: 'pdf', file_url: `${base}.pdf`, thumbnail_url: `${base}-thumb.jpg` })).toBe(`${base}-thumb.jpg`);
  });

  it('uses an image as its own preview', () => {
    expect(previewImageUrl({ item_type: 'image', file_url: `${base}.png` })).toBe(`${base}.png`);
  });
});

describe('labels, viewer and downloads', () => {
  it('labels decks and html for the client', () => {
    expect(mediaKindLabel({ item_type: 'pdf' })).toBe('slideshow');
    expect(mediaKindLabel({ item_type: 'link', file_url: `${base}.html` })).toBe('interactive');
    expect(mediaKindLabel({ item_type: 'video' })).toBe('video');
  });

  it('opens pdf and html in the viewer but not a pasted link', () => {
    expect(isViewable({ item_type: 'pdf' })).toBe(true);
    expect(isViewable({ item_type: 'link', file_url: `${base}.html` })).toBe(true);
    expect(isViewable({ item_type: 'link', url: 'https://example.com' })).toBe(false);
  });

  it('names a download without doubling the extension', () => {
    expect(downloadName({ item_type: 'pdf', title: 'Deck.pdf' })).toBe('Deck.pdf');
    expect(downloadName({ item_type: 'video', title: 'Loop' })).toBe('Loop.mp4');
  });
});
