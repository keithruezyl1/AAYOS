features to implement (out of scope)

- customer dashboard
- customer request tickets
- request leave for technicians
- technician flagged tickets
- skill based technician assignment
- kb for rules for prediction (RAG)
- manual functions in the case of no parts
- improved scheduling for technicians + My Calendar feature
- add "update vehicle details" post service in flow

IMPORTANT NOTES ABT SYSTEM
- given naka PDI rako, di ko ka send ug emails sa customer kay ang Zurich nga PDI di mu send ug email + di ka activate email sending. instead, makita ra sa System Mailbox > Outbound > Outbox ang emails with the state nga Ready
- di pud maka RBAC (system definition, roles, custom widget per page nga certain roles ra maka access, di gihapon)
- no auto redirects after login depende sa role, naka PDI raman (ui script, page route maps, widget dependencies, di gihapon)

