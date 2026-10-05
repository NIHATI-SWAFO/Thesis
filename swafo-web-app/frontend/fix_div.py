import re
with open('src/features/cases/CaseManagement.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target = """              {appeals.filter(a => a.status === 'PENDING').length === 0 && (
                <p className="text-[13px] text-slate-400 font-medium italic text-center py-4">No pending appeals.</p>
              )}
            </div>
          </div>          </div>
        </div>
      </div>
      </div>
      {selectedCase && ReactDOM.createPortal("""

replacement = """              {appeals.filter(a => a.status === 'PENDING').length === 0 && (
                <p className="text-[13px] text-slate-400 font-medium italic text-center py-4">No pending appeals.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedCase && ReactDOM.createPortal("""

c = c.replace(target, replacement)

with open('src/features/cases/CaseManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
