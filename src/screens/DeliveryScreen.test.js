import { render, screen } from '@testing-library/react';
import { api } from '../api';
import DeliveryScreen from './DeliveryScreen';

jest.mock('../api', () => ({
  api: jest.fn(),
  send: (method, body) => ({ method, body: JSON.stringify(body) })
}));

test('shows delivery orders in a table with courier and progress columns', async () => {
  api.mockImplementation(path => {
    if (path === '/admin/delivery') {
      return Promise.resolve([{
        id: 21,
        orderNumber: 'R-221',
        status: 'NEW',
        deliveryStatus: 'UNASSIGNED',
        address: { recipientName: 'Sam Guest', line1: '42 Main Street', city: 'Bengaluru', postalCode: '560001' },
        total: 520,
        placedAt: '2026-11-20T12:00:00.000Z'
      }]);
    }
    return Promise.resolve([]);
  });

  render(<DeliveryScreen token="manager-token" revision={0}/>);

  const table = await screen.findByRole('table', { name: 'Delivery orders' });
  expect(table.textContent).toContain('R-221');
  expect(table.textContent).toContain('Sam Guest');
  expect(table.textContent).toContain('42 Main Street');
  expect(table.textContent).toContain('DELIVERY PROGRESS');
  expect(table.textContent).toContain('MARK ASSIGNED');
});
