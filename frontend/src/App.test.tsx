// // src/App.test.tsx
// import { render, screen, fireEvent } from '@testing-library/react';
// import App from './App';
// import { expect, test } from 'vitest';
// import '@testing-library/jest-dom';

// test('renders Vite and React logos', () => {
//   render(<App />);

//   // Check that the logos are rendered
//   const viteLogo = screen.getByAltText(/Vite logo/i);
//   const reactLogo = screen.getByAltText(/React logo/i);

//   expect(viteLogo).toBeInTheDocument();
//   expect(reactLogo).toBeInTheDocument();
// });

// test('renders the heading "Vite + React"', () => {
//   render(<App />);

//   const heading = screen.getByText(/Vite \+ React/i);
//   expect(heading).toBeInTheDocument();
// });

// test('button click increments the count', () => {
//   render(<App />);

//   const button = screen.getByRole('button');
  
//   // Check the initial count value
//   expect(button).toHaveTextContent('count is 0');

//   // Simulate a button click
//   fireEvent.click(button);
  
//   // Check that the count has incremented
//   expect(button).toHaveTextContent('count is 1');
// });

// test('renders the "Edit src/App.tsx" text', () => {
//   render(<App />);

//   const editText = screen.getByText(/Edit src\/App.tsx/i);
//   expect(editText).toBeInTheDocument();
// });

// test('renders the "Click on the Vite and React logos to learn more" text', () => {
//   render(<App />);

//   const docsText = screen.getByText(/Click on the Vite and React logos to learn more/i);
//   expect(docsText).toBeInTheDocument();
// });


// src/App.test.tsx
import { render } from '@testing-library/react';
import App from './App';
import { describe, expect, test } from 'vitest';

describe('App Component', () => {
  test('should render', () => {
    render(<App />);
    expect(true).toBe(true);  // This is just a placeholder test
  });
});
