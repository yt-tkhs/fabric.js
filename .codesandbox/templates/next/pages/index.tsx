import { NextPage } from 'next';
import dynamic from 'next/dynamic';

// https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr
const Canvas = dynamic(
  () => import('../components/Canvas').then(({ Canvas }) => Canvas),
  {
    ssr: false,
  }
);

const IndexPage: NextPage = () => {
  return (
    <div className="position-relative">
      <Canvas />
    </div>
  );
};

export default IndexPage;
