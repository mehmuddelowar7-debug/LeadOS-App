const { QueryClient, QueryCache } = require('@tanstack/query-core');
const client = new QueryClient();
const observer = new (require('@tanstack/query-core').QueryObserver)(client, { queryKey: ['x'], enabled: false, queryFn: () => 'data' });
const res = observer.getCurrentResult();
console.log('isPending:', res.isPending, 'isLoading:', res.isLoading, 'isFetching:', res.isFetching, 'status:', res.status);
