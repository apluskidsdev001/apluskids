"use client";
import {AdminNotice,useAdminNotice} from "@/components/admin/AdminNotice";
import MinimalAdvertisementManagementWorkspace from "@/components/admin/MinimalAdvertisementManagementWorkspace";
export default function AdvertisementManagementPage(){const{notice,notify,dismissNotice}=useAdminNotice();return <><MinimalAdvertisementManagementWorkspace notify={notify}/><AdminNotice notice={notice} onDismiss={dismissNotice}/></>}
