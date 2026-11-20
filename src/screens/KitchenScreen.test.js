import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { api } from '../api';
import KitchenScreen from './KitchenScreen';

jest.mock('../api', () => ({
  api: jest.fn(),
  send: (method, body) => ({ method, body: JSON.stringify(body) })
}));

test('kitchen staff can start an accepted order item', async () => {
  api.mockImplementation(path => path.endsWith('/queue')
    ? Promise.resolve([{ id: 8, orderId: 3, orderNumber: 'R-100', orderType: 'DELIVERY', name: 'Biryani', quantity: 2, status: 'NEW', placedAt: new Date().toISOString() }])
    : Promise.resolve({ success: true }));

  render(<KitchenScreen token="staff-token" stationId={4} revision={0} connected onLogout={() => {}}/>);

  fireEvent.click(await screen.findByRole('button', { name: /MARK PREPARING/i }));

  await waitFor(() => expect(api).toHaveBeenCalledWith('/staff/order-items/8/status', {
    token: 'staff-token',
    method: 'PATCH',
    body: '{"status":"PREPARING"}'
  }));
});
