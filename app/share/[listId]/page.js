import ShareLanding from '../../../src/components/ShareLanding';

export default async function SharedListPage({ params }) {
    const { listId } = await params;
    return <ShareLanding listId={listId} />;
}
