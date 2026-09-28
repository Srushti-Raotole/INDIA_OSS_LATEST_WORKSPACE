import { useParams } from 'react-router-dom';
import CreateTopologyTable from './CreateTopologyTable';

export default function EditTopologyWrapper() {
  const { id } = useParams<{ id: string }>();
  return <CreateTopologyTable editId={id} />;
}
