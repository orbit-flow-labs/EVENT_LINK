import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EventImage } from './EventImage';

describe('EventImage', () => {
  it('renders an accessible placeholder for unsafe image protocols', () => {
    const markup = renderToStaticMarkup(
      <EventImage src="javascript:alert(1)" alt="Unsafe event" />,
    );

    expect(markup).not.toContain('<img');
    expect(markup).toContain('role="img"');
    expect(markup).toContain('Unsafe event: image unavailable');
  });

  it('renders HTTPS event images', () => {
    const markup = renderToStaticMarkup(
      <EventImage src="https://images.example.test/event.jpg" alt="Safe event" />,
    );

    expect(markup).toContain('<img');
    expect(markup).toContain('src="https://images.example.test/event.jpg"');
    expect(markup).toContain('alt="Safe event"');
  });

  it('rejects insecure remote HTTP image URLs', () => {
    const markup = renderToStaticMarkup(
      <EventImage src="http://images.example.test/event.jpg" alt="Insecure event" />,
    );

    expect(markup).not.toContain('<img');
    expect(markup).toContain('Insecure event: image unavailable');
  });

  it('shows the accessible fallback when an image request fails', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<EventImage src="https://images.example.test/broken.jpg" alt="Broken event" />);
    });

    const image = container.querySelector('img');
    expect(image).not.toBeNull();

    await act(async () => {
      image?.dispatchEvent(new Event('error'));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[role="img"]')?.getAttribute('aria-label'))
      .toBe('Broken event: image unavailable');

    await act(async () => root.unmount());
  });
});