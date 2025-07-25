import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"; // Cross icon
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const AddedOffersTab = ({ addedOffers, setAddedOffers, activeOffers, setActiveOffers, studentCurrentHours,
  setStudentCurrentHours }) => {
    console.log("addedOffers in AddedOffersTab: ", addedOffers);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState(null); // { taStudentId, sectionIndex }

    const openConfirmDialog = (taStudentId, sectionIndex) => {
        setOfferToDelete({ taStudentId, sectionIndex });
        setShowConfirmDialog(true);
    };

    const confirmDelete = () => {
        if (!offerToDelete) return;

        const { taStudentId, sectionIndex } = offerToDelete;

        // First find the section and calculate hours
        const sectionToDelete = addedOffers
            .find((offer) => offer.taStudentId === taStudentId)
            ?.offers[sectionIndex];

        const sectionHours = (sectionToDelete?.slots?.length ?? 0) * 0.5;

        // Update studentCurrentHours first (only once)
        setStudentCurrentHours((prevHours) => {
            const current = prevHours[taStudentId] || 0;
            return {
            ...prevHours,
            [taStudentId]: Math.max(0, current - sectionHours),
            };
        });
        
        // Then update addedOffers to remove the section
        setAddedOffers((prev) => {
            const updatedOffers = prev.map((offer) => {
            if (offer.taStudentId !== taStudentId) return offer;

            return {
                ...offer,
                offers: offer.offers.filter((_, idx) => idx !== sectionIndex),
            };
            });

            return updatedOffers.filter((offer) => offer.offers.length > 0);
        });


        console.log("addedOffers variable after confirming deletion of a course offering or shared session: ", addedOffers);
        console.log("studentCurrentHours variable after confirming deletion of a course offering or shared session: ", addedOffers);

        setShowConfirmDialog(false);
        setOfferToDelete(null);
    };

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
                                    <span>
                                        {offer.course_number} - {offer.course_name} (Section {offer.section_number})
                                    </span>
                                    <button
                                    onClick={() => openConfirmDialog(taOffer.taStudentId, idx)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Remove"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
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
            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove Course Section</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to delete this course offering or shared session?</p>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                    Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDelete}>
                    Yes, Delete
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AddedOffersTab;
