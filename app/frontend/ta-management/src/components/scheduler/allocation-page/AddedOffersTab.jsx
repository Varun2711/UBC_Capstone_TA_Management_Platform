import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"

const AddedOffersTab = ({ addedOffers, setAddedOffers, activeOffers, setActiveOffers }) => {
    console.log("addedOffers in AddedOffersTab: ", addedOffers);

    const transferAddedOffersToActive = () => {
        setActiveOffers((prev) => {
            // Merge offers per TA
            const newOffers = [...prev];

            addedOffers.forEach((added) => {
            const existing = newOffers.find((o) => o.taStudentId === added.taStudentId);
            if (existing) {
                // Prevent duplicate sections
                const newUniqueOffers = added.offers.filter(
                (aOffer) =>
                    !existing.offers.some(
                    (eOffer) =>
                        eOffer.sectionId === aOffer.sectionId &&
                        eOffer.course_number === aOffer.course_number
                    )
                );
                existing.offers.push(...newUniqueOffers);
            } else {
                newOffers.push({ ...added });
            }
            });
    
            return newOffers;
        });

        // Clear added offers
        setAddedOffers([]);
    };

    return (
        <div className="space-y-4">
            {addedOffers.length === 0 && (
                <p className="text-muted-foreground">No offers have been added yet.</p>
            )}
            {addedOffers.map((taOffer) => (
                <Card key={taOffer.taStudentId}>
                    <CardHeader>
                        <CardTitle>{taOffer.taName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {taOffer.offers.length === 0 ? (
                            <p className="text-muted-foreground">No course sections added yet.</p>
                        ) : (
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {taOffer.offers.map((offer, idx) => (
                                <li key={idx}>
                                    {offer.course_number} - {offer.course_name} (Section {offer.section_number})
                                </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            ))}
            {addedOffers.length > 0 && (
                <div className="flex justify-end p-4">
                    <Button onClick={transferAddedOffersToActive}>
                        Send Offer
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AddedOffersTab;
