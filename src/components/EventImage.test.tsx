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
});