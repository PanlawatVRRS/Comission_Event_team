'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Lang = 'th' | 'en'

const th = {
  // common
  'common.refresh': 'รีเฟรช',
  'common.cancel': 'ยกเลิก',
  'common.save': 'บันทึก',
  'common.saving': 'กำลังบันทึก...',
  'common.edit': 'แก้ไข',
  'common.delete': 'ลบ',
  'common.manage': 'จัดการ',
  'common.people': '{n} คน',
  'common.items': '{n} รายการ',
  'common.timeSuffix': 'น.',

  // nav
  'nav.dashboard': 'แดชบอร์ด',
  'nav.employees': 'จัดการพนักงาน',
  'nav.dailyBoard': 'กระดานรายวัน',
  'nav.reconcile': 'กระทบยอด (Reconcile)',
  'nav.inviteHistory': 'ประวัติกระทบยอดรายวัน',
  'nav.dbStatus': 'Database Status',
  'nav.mainMenu': 'เมนูหลัก',
  'nav.settings': 'ตั้งค่าระบบ',
  'nav.expand': 'ขยายแถบข้าง',
  'nav.collapse': 'พับเก็บแถบข้าง',
  'nav.darkMode': 'โหมดมืด (Dark)',
  'nav.lightMode': 'โหมดสว่าง (Light)',
  'nav.switchToLight': 'เปลี่ยนเป็น Light Mode',
  'nav.switchToDark': 'เปลี่ยนเป็น Dark Mode',
  'nav.switch': 'สลับ',

  // settings modal
  'settings.title': 'ตั้งค่าระบบ (System Settings)',
  'settings.theme': 'รูปแบบการแสดงผล (Theme)',
  'settings.language': 'เลือกภาษา (Language)',
  'settings.saveClose': 'บันทึก / ปิด',

  // table
  'table.no': 'ลำดับ',
  'table.userNumber': 'User Number',
  'table.fullName': 'ชื่อ-นามสกุล',
  'table.nickname': 'ชื่อเล่น',
  'table.phone': 'เบอร์โทรศัพท์',
  'table.invites': 'ยอดเชิญเพื่อนสำเร็จ',
  'table.empty': 'ยังไม่มีข้อมูลพนักงาน',

  // dashboard
  'dashboard.title': 'แดชบอร์ดสรุปผล (Dashboard)',
  'dashboard.subtitle': 'สรุปข้อมูลจำนวนพนักงาน ยอดการเชิญเพื่อน และลำดับพนักงานตามคอมมิชชั่น',
  'dashboard.refreshData': 'รีเฟรชข้อมูล',
  'dashboard.totalEmployees': 'จำนวนพนักงานทั้งหมด',
  'dashboard.totalInvites': 'รวมยอดเชิญเพื่อนสำเร็จ',
  'dashboard.top1': 'พนักงานอันดับ #1',
  'dashboard.tableTitle': 'ตารางสรุป Daily Commission พนักงาน',
  'dashboard.loading': 'กำลังโหลดข้อมูล...',

  // employees page
  'employees.title': 'ระบบจัดการพนักงาน',
  'employees.subtitle': 'เพิ่ม แก้ไข หรือลบรายชื่อพนักงาน ชื่อเล่น เบอร์โทรศัพท์ และ User Number',
  'employees.add': 'เพิ่มพนักงานใหม่',
  'employees.confirmDelete': 'คุณต้องการลบข้อมูลพนักงานรายนี้ใช่หรือไม่?',
  'employees.deleteFail': 'ไม่สามารถลบพนักงานได้: {msg}',

  // employee modal
  'modal.editTitle': 'แก้ไขข้อมูลพนักงาน',
  'modal.addTitle': 'เพิ่มพนักงานใหม่',
  'modal.close': 'ปิดหน้าต่าง',
  'modal.saveFailed': 'บันทึกไม่สำเร็จ:',
  'modal.saveError': 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
  'modal.fullName': 'ชื่อ-นามสกุล',
  'modal.fullNamePh': 'เช่น สมชาย ใจดี',
  'modal.nickname': 'ชื่อเล่น',
  'modal.nicknamePh': 'เช่น ก้อง',
  'modal.phone': 'เบอร์โทรศัพท์',
  'modal.userNumber': 'User Number (Col A)',
  'modal.userNumberPh': 'เช่น U1002938',

  // reconcile page
  'reconcile.title': 'ระบบคำนวณกระทบยอด (Reconciliation)',
  'reconcile.subtitle':
    'อัปโหลดไฟล์ data of invite เพื่อนำ User number (Col A) ไปนับกระทบยอดเข้า daily commission (Col E)',
  'reconcile.success': 'กระทบยอดสำเร็จ! คุณสามารถกลับไปตรวจสอบผลลัพธ์ที่หน้า Dashboard ได้แล้ว',

  // import modal
  'import.title': 'นำเข้าไฟล์ Data of Invite',
  'import.subtitle': 'อัปโหลดไฟล์เพื่อคำนวณนับยอดเชิญเพื่อนกระทบเข้า Daily Commission',
  'import.pick': 'คลิกเพื่อเลือกไฟล์ Excel / CSV (data of invite)',
  'import.supports': 'รองรับไฟล์ .xlsx, .xls, .csv',
  'import.success': 'คำนวณและกระทบยอดข้อมูลเรียบร้อยแล้ว!',
  'import.summary': 'ประมวลผลทั้งหมด {total} รายการ (แมตช์พนักงาน {users} คน)',
  'import.errorTitle': 'ข้อผิดพลาด',
  'import.loadingBtn': 'กำลังอ่านไฟล์และคำนวณกระทบยอด...',
  'import.btn': 'นำเข้าและคำนวณกระทบยอด',
  'import.notJson': 'เซิร์ฟเวอร์ตอบกลับไม่ใช่ JSON (HTTP {status}): {detail}',
  'import.notFound': 'ไม่พบเส้นทาง API (404 Not Found)',
  'import.connectFail': 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
  'import.serverError': 'เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์ (HTTP {status})',

  // history
  'history.title': 'ประวัติการนำเข้าและกระทบยอดรายวัน',
  'history.subtitle': 'รายการบันทึกประวัติการกระทบยอดไฟล์ Data of Invite ย้อนหลัง',
  'history.colDate': 'วันที่ทำรายการ',
  'history.colFile': 'ชื่อไฟล์ที่อัปโหลด',
  'history.colTotal': 'รายการทั้งหมดในไฟล์',
  'history.colMatched': 'พนักงานที่แมตช์ได้',
  'history.colTime': 'เวลาประมวลผล',
  'history.loading': 'กำลังโหลดข้อมูลประวัติ...',
  'history.empty': 'ยังไม่มีประวัติการทำรายการกระทบยอด',

  // daily board + reconcile modal
  'board.selectDate': 'กรุณาเลือกวันที่ต้องการสร้างบอร์ด',
  'board.noSheet': 'ไม่พบข้อมูล Sheet ในไฟล์ Excel',
  'board.emptyFile': 'ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์ว่างเปล่า',
  'board.selectUser': 'กรุณาเลือก User ที่ต้องการกระทบยอด',
  'board.noMatch': 'ไม่พบรายการ Recommender user number ใน Excel ที่ตรงกับ User Number ของพนักงานในระบบ',
  'board.createdOk': 'สร้างบอร์ดประจำวันที่ {date} สำเร็จ! นำเข้าข้อมูล Recommender และ Creation Time เรียบร้อย ({n} คน)',
  'board.reconcileFail': 'เกิดข้อผิดพลาดในการกระทบยอดไฟล์ Excel',
  'board.addedOk': 'เพิ่มพนักงานลงบอร์ดประจำวันที่ {date} เรียบร้อยแล้ว',
  'board.confirmDeleteSelected': 'คุณต้องการลบรายการที่เลือกจำนวน {n} รายการ ใช่หรือไม่?',
  'board.deletedSelected': 'ลบรายการที่เลือกเรียบร้อยแล้ว',
  'board.deleteFail': 'เกิดข้อผิดพลาดในการลบ: {msg}',
  'board.confirmDeleteDay': '⚠️ เตือน: คุณต้องการลบข้อมูลบอร์ดประจำวันที่ "{day}" ทั้งหมดใช่หรือไม่?',
  'board.deletedDay': 'ลบข้อมูลบอร์ดประจำวันที่ {day} เรียบร้อยแล้ว',
  'board.deleteDayFail': 'เกิดข้อผิดพลาดในการลบข้อมูลประจำวัน: {msg}',
  'board.confirmDeleteOne': 'คุณต้องการลบรายการนี้ใช่หรือไม่?',
  'xl.uid': 'U ID สำหรับกระทบยอด',
  'xl.time': 'เวลาสำเร็จ',
  'xl.teamList': 'รายชื่อทีม Event ภาคสนาม',
  'xl.userNumber': 'User Number พนักงาน',
  'board.title': 'กระดานสรุปผลรายวัน (Daily KPI Board)',
  'board.subtitle': 'นำเข้าไฟล์ Excel กระทบยอดเพื่อลงยอด KPI อัตโนมัติ จัดกลุ่มทีมแยก Sheet และส่งออกรายงานอย่างสวยงาม',
  'board.pickDate': 'เลือกวันที่ต้องการสร้างบอร์ด',
  'board.reconcileTitle': 'กระทบยอดจากไฟล์ Excel',
  'board.reconcileDesc': 'เลือกไฟล์, เลือก User และกำหนด KPI Target ในหน้าต่างกระทบยอด',
  'board.reconcileBtn': 'กระทบยอด Excel',
  'board.option2': 'ทางเลือกที่ 2: เลือกและเพิ่มพนักงานด้วยตนเอง ({n} คน)',
  'board.staffInSystem': 'พนักงานในระบบ {n} คน',
  'board.selectStaff': '-- เลือกพนักงาน --',
  'board.hasKpi': 'มี KPI',
  'board.noKpi': 'ไม่มี KPI',
  'board.addAnother': 'เพิ่มพนักงานอีกคน',
  'board.saveStaff': 'บันทึกพนักงาน ({n} คน)',
  'board.selectedPre': 'เลือกอยู่ ',
  'board.selectedPost': ' รายการ',
  'board.clearSelect': 'ยกเลิกเลือก',
  'board.deleteSelected': 'ลบรายการที่เลือก ({n})',
  'board.colDate': 'วันที่',
  'board.colStaff': 'พนักงาน',
  'board.passFail': 'ผ่าน / ไม่ผ่าน',
  'board.emptyDay': 'ยังไม่มีข้อมูลรายวัน กรอกข้อมูลด้านบนหรืออัปโหลด Excel เพื่อสร้างบอร์ด',
  'board.exportExcel': 'ส่งออก Excel',
  'board.exportTitleAttr': 'ดาวน์โหลดไฟล์ Excel แยกทีม',
  'board.selectDay': 'เลือกทั้งวัน ({n})',
  'board.selectDayTitle': 'เลือกพนักงานทั้งหมดของวันนี้',
  'board.deleteDay': 'ลบทั้งวัน',
  'board.deleteDayTitle': 'ลบข้อมูลบอร์ดประจำวันนี้ทั้งหมด',
  'board.pass': 'ผ่าน',
  'board.notPass': 'ไม่ผ่าน',
  'board.exportTitle': 'การจัดกลุ่มทีมและส่งออก Excel แยก Sheet ({date})',
  'board.exportDesc': 'กำหนดทีมพนักงานเพื่อสร้างไฟล์ Excel แยกตามรายชื่อทีมและดึง U ID ลูกค้าที่ตรงกัน',
  'board.teamCount': 'จำนวนทีมทั้งหมด:',
  'board.teamsN': '{n} ทีม',
  'board.team': 'ทีม {n}',
  'board.autoDistribute': 'แบ่งทีมเท่าๆ กัน',
  'board.assignTeams': 'กำหนดทีมของพนักงาน ({n} คน)',
  'board.downloadXlsx': 'ดาวน์โหลดไฟล์ Excel (.xlsx)',
  'rm.readFail': 'ไม่สามารถอ่านไฟล์ Excel ได้',
  'rm.pickFile': 'กรุณาเลือกไฟล์ Excel สำหรับกระทบยอด',
  'rm.pickUser': 'กรุณาเลือก User อย่างน้อย 1 คน',
  'rm.waitPreview': 'กรุณารอให้ระบบอ่านไฟล์ Excel เสร็จก่อน',
  'rm.title': 'กระทบยอด Daily KPI',
  'rm.subtitle': 'วันที่ {date} · เลือกไฟล์ + User + KPI Target แล้วจึงยืนยัน',
  'rm.step1': '1. เลือกไฟล์ Excel กระทบยอด',
  'rm.step1Desc': 'ระบบจะอ่าน Recommender User Number จากคอลัมน์แรกเพื่อแสดงยอดที่จับคู่ได้',
  'rm.changeFile': 'เปลี่ยนไฟล์',
  'rm.chooseFile': 'เลือกไฟล์',
  'rm.reading': ' · กำลังอ่านไฟล์...',
  'rm.readDone': ' · อ่านไฟล์แล้ว',
  'rm.ready': 'พร้อมตรวจสอบ',
  'rm.step2': '2. เลือก User และกำหนด KPI Target',
  'rm.step2Desc': 'เลือกเฉพาะคนที่ต้องการกระทบยอดได้ ไม่จำเป็นต้องเลือกทุกคน',
  'rm.selectedOf': 'เลือกแล้ว {a} / {b} คน',
  'rm.searchPh': 'ค้นหาชื่อ ชื่อเล่น หรือ User Number...',
  'rm.deselectAll': 'ยกเลิกทั้งหมด',
  'rm.selectAll': 'เลือกทั้งหมด',
  'rm.noResults': 'ไม่พบพนักงานที่ค้นหา',
  'rm.totalPre': 'ยอด Excel ของ User ที่เลือกทั้งหมด: ',
  'rm.totalPost': ' รายการ',
  'rm.clearUsers': 'ล้างการเลือก User',
  'rm.reconciling': 'กำลังกระทบยอด...',
  'rm.confirm': 'ยืนยันกระทบยอด & ลง Daily Board',
}

export type TKey = keyof typeof th

const en: Record<TKey, string> = {
  'common.refresh': 'Refresh',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.manage': 'Actions',
  'common.people': '{n} people',
  'common.items': '{n} records',
  'common.timeSuffix': '',

  'nav.dashboard': 'Dashboard',
  'nav.employees': 'Employees',
  'nav.dailyBoard': 'Daily Board',
  'nav.reconcile': 'Reconcile',
  'nav.inviteHistory': 'Invite History',
  'nav.dbStatus': 'Database Status',
  'nav.mainMenu': 'Main Menu',
  'nav.settings': 'Settings',
  'nav.expand': 'Expand sidebar',
  'nav.collapse': 'Collapse sidebar',
  'nav.darkMode': 'Dark Mode',
  'nav.lightMode': 'Light Mode',
  'nav.switchToLight': 'Switch to Light Mode',
  'nav.switchToDark': 'Switch to Dark Mode',
  'nav.switch': 'Switch',

  'settings.title': 'System Settings',
  'settings.theme': 'Theme Mode',
  'settings.language': 'Select Language',
  'settings.saveClose': 'Save & Close',

  'table.no': 'No.',
  'table.userNumber': 'User Number',
  'table.fullName': 'Full Name',
  'table.nickname': 'Nickname',
  'table.phone': 'Phone',
  'table.invites': 'Successful Invites',
  'table.empty': 'No employees yet',

  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Overview of employees, successful invites and commission ranking',
  'dashboard.refreshData': 'Refresh data',
  'dashboard.totalEmployees': 'Total Employees',
  'dashboard.totalInvites': 'Total Successful Invites',
  'dashboard.top1': 'Top Performer #1',
  'dashboard.tableTitle': 'Employee Daily Commission Summary',
  'dashboard.loading': 'Loading data...',

  'employees.title': 'Employee Management',
  'employees.subtitle': 'Add, edit or remove employees, nicknames, phone numbers and User Numbers',
  'employees.add': 'Add Employee',
  'employees.confirmDelete': 'Are you sure you want to delete this employee?',
  'employees.deleteFail': 'Could not delete employee: {msg}',

  'modal.editTitle': 'Edit Employee',
  'modal.addTitle': 'Add Employee',
  'modal.close': 'Close',
  'modal.saveFailed': 'Save failed:',
  'modal.saveError': 'An error occurred while saving',
  'modal.fullName': 'Full Name',
  'modal.fullNamePh': 'e.g. John Smith',
  'modal.nickname': 'Nickname',
  'modal.nicknamePh': 'e.g. Johnny',
  'modal.phone': 'Phone',
  'modal.userNumber': 'User Number (Col A)',
  'modal.userNumberPh': 'e.g. U1002938',

  'reconcile.title': 'Reconciliation',
  'reconcile.subtitle':
    'Upload the "data of invite" file to count User numbers (Col A) against daily commission (Col E)',
  'reconcile.success': 'Reconciliation complete! You can now check the results on the Dashboard.',

  'import.title': 'Import Data of Invite',
  'import.subtitle': 'Upload a file to count successful invites against Daily Commission',
  'import.pick': 'Click to choose an Excel / CSV file (data of invite)',
  'import.supports': 'Supports .xlsx, .xls, .csv',
  'import.success': 'Reconciliation completed successfully!',
  'import.summary': 'Processed {total} records ({users} employees matched)',
  'import.errorTitle': 'Error',
  'import.loadingBtn': 'Reading file and reconciling...',
  'import.btn': 'Import & Reconcile',
  'import.notJson': 'Server did not return JSON (HTTP {status}): {detail}',
  'import.notFound': 'API route not found (404 Not Found)',
  'import.connectFail': 'Unable to connect to the server',
  'import.serverError': 'Server error (HTTP {status})',

  'history.title': 'Import & Daily Reconciliation History',
  'history.subtitle': 'Past reconciliation records of Data of Invite files',
  'history.colDate': 'Date',
  'history.colFile': 'Uploaded File',
  'history.colTotal': 'Records in File',
  'history.colMatched': 'Matched Employees',
  'history.colTime': 'Processed At',
  'history.loading': 'Loading history...',
  'history.empty': 'No reconciliation history yet',

  // daily board + reconcile modal
  'board.selectDate': 'Please select a date for the board',
  'board.noSheet': 'No sheet found in the Excel file',
  'board.emptyFile': 'No data found in the Excel file, or the file is empty',
  'board.selectUser': 'Please select the users to reconcile',
  'board.noMatch': 'No Recommender user numbers in the Excel file match any employee User Number in the system',
  'board.createdOk': 'Board for {date} created! Recommender and Creation Time data imported ({n} people)',
  'board.reconcileFail': 'An error occurred while reconciling the Excel file',
  'board.addedOk': 'Staff added to the board for {date}',
  'board.confirmDeleteSelected': 'Are you sure you want to delete the {n} selected records?',
  'board.deletedSelected': 'Selected records deleted',
  'board.deleteFail': 'Error while deleting: {msg}',
  'board.confirmDeleteDay': '⚠️ Warning: Are you sure you want to delete the entire board for "{day}"?',
  'board.deletedDay': 'Board for {day} deleted',
  'board.deleteDayFail': 'Error while deleting the daily board: {msg}',
  'board.confirmDeleteOne': 'Are you sure you want to delete this record?',
  'xl.uid': 'U ID for reconciliation',
  'xl.time': 'Success time',
  'xl.teamList': 'Field Event Team Roster',
  'xl.userNumber': 'Staff User Number',
  'board.title': 'Daily KPI Board',
  'board.subtitle': 'Import an Excel file to reconcile and record KPI automatically, group staff into teams per sheet, and export a polished report',
  'board.pickDate': 'Select the date to create a board for',
  'board.reconcileTitle': 'Reconcile from Excel file',
  'board.reconcileDesc': 'Choose a file, pick users and set KPI targets in the reconcile window',
  'board.reconcileBtn': 'Reconcile Excel',
  'board.option2': 'Option 2: Add staff manually ({n} people)',
  'board.staffInSystem': '{n} staff in the system',
  'board.selectStaff': '-- Select staff --',
  'board.hasKpi': 'Has KPI',
  'board.noKpi': 'No KPI',
  'board.addAnother': 'Add another staff',
  'board.saveStaff': 'Save staff ({n})',
  'board.selectedPre': 'Selected ',
  'board.selectedPost': ' items',
  'board.clearSelect': 'Clear selection',
  'board.deleteSelected': 'Delete selected ({n})',
  'board.colDate': 'Date',
  'board.colStaff': 'Staff',
  'board.passFail': 'Pass / Fail',
  'board.emptyDay': 'No daily data yet. Fill in the form above or upload an Excel file to create a board',
  'board.exportExcel': 'Export Excel',
  'board.exportTitleAttr': 'Download Excel file split by team',
  'board.selectDay': 'Select day ({n})',
  'board.selectDayTitle': 'Select all of this day\'s staff',
  'board.deleteDay': 'Delete day',
  'board.deleteDayTitle': 'Delete this day\'s entire board',
  'board.pass': 'Pass',
  'board.notPass': 'Fail',
  'board.exportTitle': 'Team grouping & Excel export by sheet ({date})',
  'board.exportDesc': 'Assign staff to teams to build an Excel file split by team and pull the matching customer U IDs',
  'board.teamCount': 'Number of teams:',
  'board.teamsN': '{n} teams',
  'board.team': 'Team {n}',
  'board.autoDistribute': 'Distribute evenly',
  'board.assignTeams': 'Assign staff to teams ({n})',
  'board.downloadXlsx': 'Download Excel file (.xlsx)',
  'rm.readFail': 'Unable to read the Excel file',
  'rm.pickFile': 'Please choose an Excel file to reconcile',
  'rm.pickUser': 'Please select at least 1 user',
  'rm.waitPreview': 'Please wait until the Excel file has been read',
  'rm.title': 'Reconcile Daily KPI',
  'rm.subtitle': 'Date {date} · Choose a file + users + KPI Target, then confirm',
  'rm.step1': '1. Choose the Excel file to reconcile',
  'rm.step1Desc': 'The system reads Recommender User Numbers from the first column to show matched counts',
  'rm.changeFile': 'Change file',
  'rm.chooseFile': 'Choose file',
  'rm.reading': ' · Reading file...',
  'rm.readDone': ' · File read',
  'rm.ready': 'Ready to review',
  'rm.step2': '2. Select users and set KPI Target',
  'rm.step2Desc': 'You can reconcile only the people you need; not everyone has to be selected',
  'rm.selectedOf': 'Selected {a} / {b}',
  'rm.searchPh': 'Search name, nickname or User Number...',
  'rm.deselectAll': 'Deselect all',
  'rm.selectAll': 'Select all',
  'rm.noResults': 'No matching staff found',
  'rm.totalPre': 'Total Excel count for selected users: ',
  'rm.totalPost': ' records',
  'rm.clearUsers': 'Clear user selection',
  'rm.reconciling': 'Reconciling...',
  'rm.confirm': 'Confirm reconcile & post to Daily Board',
}

const dictionaries: Record<Lang, Record<TKey, string>> = { th, en }

type Params = Record<string, string | number>

interface LanguageContextValue {
  lang: Lang
  locale: string // ใช้กับ toLocaleDateString / toLocaleTimeString
  setLanguage: (lang: Lang) => void
  t: (key: TKey, params?: Params) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('th')

  // โหลดภาษาที่เคยเลือกไว้ (ทำหลัง mount เพื่อไม่ให้ hydration mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang')
      if (saved === 'th' || saved === 'en') setLang(saved)
    } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLanguage = useCallback((next: Lang) => {
    setLang(next)
    try {
      localStorage.setItem('lang', next)
    } catch {}
  }, [])

  const t = useCallback(
    (key: TKey, params?: Params) => {
      let text = dictionaries[lang][key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.split(`{${k}}`).join(String(v))
        }
      }
      return text
    },
    [lang]
  )

  const value = useMemo(
    () => ({ lang, locale: lang === 'th' ? 'th-TH' : 'en-US', setLanguage, t }),
    [lang, setLanguage, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}