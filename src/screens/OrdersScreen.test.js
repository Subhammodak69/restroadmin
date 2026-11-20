import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { api } from '../api';
import OrdersScreen from './OrdersScreen';

jest.mock('../api', () => ({
  api: jest.fn(),
  send: (method, body) => ({ method, body: JSON.stringify(body) })
}));

test('shows an order action and advances a new order to accepted', async () => {
  api.mockImplementation(path => path === '/admin/orders'
    ? Promise.resolve([{ id: 3, orderNumber: 'R-100', orderType: 'DINE_IN', status: 'NEW', total: 250, items: [] }])
    : Promise.resolve({ status: 'ACCEPTED' }));

  render(<OrdersScreen token="manager-token" revision={0} onManageDelivery={() => {}}/>);
  fireEvent.click(await screen.findByRole('button', { name: /MARK ACCEPTED/i }));

  await waitFor(() => expect(api).toHaveBeenCalledWith('/admin/orders/3/status', {
    token: 'manager-token',
    method: 'PATCH',
    body: '{"status":"ACCEPTED"}'
  }));
});
