import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import { ImagePicker } from '../ImagePicker'

test('ImagePicker component renders', () => {
  const { container } = render(<ImagePicker />);
  expect(container).toBeInTheDocument();
});