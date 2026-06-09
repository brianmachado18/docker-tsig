import { create } from 'zustand';

const useMapPopupStore = create((set) => ({
  isOpen: false,
  entity: null,
  entityType: null,

  openPopup: (entity, entityType) => set({ isOpen: true, entity, entityType }),
  closePopup: () => set({ isOpen: false, entity: null, entityType: null }),
}));

export default useMapPopupStore;
