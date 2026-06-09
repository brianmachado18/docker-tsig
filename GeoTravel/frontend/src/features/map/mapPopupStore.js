import { create } from 'zustand';

const useMapPopupStore = create((set) => ({
  isOpen: false,
  entity: null,
  entityType: null, // 'attraction' | 'route'
  travelTimes: null,
  isLoadingTimes: false,

  openPopup: (entity, entityType) =>
    set({ isOpen: true, entity, entityType, travelTimes: null, isLoadingTimes: true }),
  closePopup: () =>
    set({ isOpen: false, entity: null, entityType: null, travelTimes: null, isLoadingTimes: false }),
  setTravelTimes: (times) =>
    set({ travelTimes: times, isLoadingTimes: false }),
}));

export default useMapPopupStore;
