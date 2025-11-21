import React from 'react';
import { render } from '@testing-library/react';
import Popup from '../src/ui/Popup';

describe('Popup Component', () => {
  it('renders without crashing', () => {
    render(<Popup />);
  });
});
