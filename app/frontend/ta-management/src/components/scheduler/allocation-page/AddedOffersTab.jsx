import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCourseOfferingDetails } from "@/logic/coordinator-allocations-page";

const AddedOffersTab = ({
  offers,
  setOffers,
  activeOffers,
  setActiveOffers,
  studentCurrentHours,
  setStudentCurrentHours,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null); // { offerId, itemIndex }
  const [courseOfferingDetails, setCourseOfferingDetails] = useState({});


  const openConfirmDialog = (offerId, itemIndex) => {
    setOfferToDelete({ offerId, itemIndex });
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (!offerToDelete) return;
    const { offerId, itemIndex } = offerToDelete;

    const updatedOffers = offers.map((offer) => {
      if (offer.offer_id !== offerId) return offer;

      const deletedItem = offer.offer_items[itemIndex];
      const sectionHours = (deletedItem?.slots?.length ?? 0) * 0.5;
      const studentId = offer.student.id;

      // Update studentCurrentHours
      setStudentCurrentHours((prevHours) => {
        const current = prevHours[studentId] || 0;
        return {
          ...prevHours,
          [studentId]: Math.max(0, current - sectionHours),
        };
      });

      const newItems = offer.offer_items.filter((_, idx) => idx !== itemIndex);
      return { ...offer, offer_items: newItems };
    });

    // Remove empty offers
    const cleanedOffers = updatedOffers.filter((offer) => offer.offer_items.length > 0);

    setOffers(cleanedOffers);
    setShowConfirmDialog(false);
    setOfferToDelete(null);
  };

  const transferAddedOffersToActive = () => {
    setActiveOffers((prev) => {
      const merged = [...prev];
      offers.forEach((draftOffer) => {
        const existing = merged.find((o) => o.offer_id === draftOffer.offer_id);
        if (existing) {
          const newItems = draftOffer.offer_items.filter(
            (newItem) =>
              !existing.offer_items.some(
                (existingItem) =>
                  existingItem.sectionId === newItem.sectionId &&
                  existingItem.course_number === newItem.course_number
              )
          );
          existing.offer_items.push(...newItems);
        } else {
          merged.push({ ...draftOffer });
        }
      });
      return merged;
    });

    setOffers([]);
  };

    const getCourseOfferingDetails = async (courseOfferingId) => {
        try {
            const courseOfferingDetails = await fetchCourseOfferingDetails(courseOfferingId);
            console.log("Course Offering Details in courseOfferingDetails:", courseOfferingDetails);
            return courseOfferingDetails;
            
        } catch (error) {
            console.error("Error fetching course offering details:", error);
            return null;
        }
    };

    useEffect(() => {
        const fetchAllDetails = async () => {
            const detailsMap = {};

            for (const offer of offers) {
            for (const item of offer.offer_items) {
                const id = item.course_offering_id;
                console.log("Course offering item in for loop: ", item);
                console.log("Course offering id in for loop: ", id);
                if (!detailsMap[id]) {
                try {
                    const details = await getCourseOfferingDetails(id);
                    detailsMap[id] = details;
                } catch (error) {
                    console.error(`Error fetching details for ID ${id}`, error);
                }
                }
            }
            }

            setCourseOfferingDetails(detailsMap);
        };

        if (offers.length > 0) {
            fetchAllDetails();
        }
    }, [offers]);

  return (
    <div className="space-y-4">
      {offers.length === 0 && (
        <p className="text-muted-foreground">No offers have been added yet.</p>
      )}
      {offers.map((offer) => {
        if (offer.status !== "draft") return null;

        return (
            <Card key={offer.offer_id}>
            <CardHeader>
                <CardTitle>{offer.student.name}</CardTitle>
            </CardHeader>
            <CardContent>
                {offer.offer_items.length === 0 ? (
                <p className="text-muted-foreground">No course sections added yet.</p>
                ) : (
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {offer.offer_items.map((item, idx) => {
                        const offeringDetails = courseOfferingDetails[item.course_offering_id];
                        return (
                            <li key={idx} className="flex items-center justify-between gap-2 py-1">
                                <span>
                                {item.course_number} - {item.course_name} ({item.section_type_display} {item.section_number})
                                </span>
                                <button
                                onClick={() => openConfirmDialog(offer.offer_id, idx)}
                                title="Remove"
                                className="w-6 h-6 flex items-center justify-center border border-red-300 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                                >
                                <X className="w-4 h-4" strokeWidth={3} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
                )}
            </CardContent>
            </Card>
        );
      })}
      {offers.length > 0 && (
        <div className="flex justify-end p-4">
          <Button onClick={transferAddedOffersToActive}>Send Offer</Button>
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
