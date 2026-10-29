export default function RootLoading() {
  return (
    <>
      <div className="background-animation">
        <div className="grid"></div>
      </div>

      {/* SKELETON NAVBAR */}
      <nav className="navbar navbar-expand-lg">
        <div className="container">
          <div className="d-flex align-items-center gap-3">
            <div
              className="skeleton-shimmer skeleton-circle"
              style={{ width: "36px", height: "36px" }}
            />
            <div
              className="skeleton-shimmer"
              style={{ width: "140px", height: "20px", borderRadius: "6px" }}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <div
              className="skeleton-shimmer skeleton-pill"
              style={{ width: "110px", height: "32px" }}
            />
            <div
              className="skeleton-shimmer skeleton-pill"
              style={{ width: "90px", height: "32px" }}
            />
          </div>
        </div>
      </nav>

      <div className="container mt-4" style={{ position: "relative", zIndex: 10 }}>
        {/* Header Skeleton */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div
              className="skeleton-shimmer"
              style={{ width: "220px", height: "28px", marginBottom: "8px" }}
            />
            <div
              className="skeleton-shimmer"
              style={{ width: "340px", height: "16px" }}
            />
          </div>
          <div className="d-flex gap-2">
            <div
              className="skeleton-shimmer skeleton-pill"
              style={{ width: "120px", height: "36px" }}
            />
            <div
              className="skeleton-shimmer skeleton-pill"
              style={{ width: "170px", height: "36px" }}
            />
          </div>
        </div>

        {/* 5 Stats Cards Skeleton */}
        <div className="row g-3 mb-4 row-cols-2 row-cols-md-3 row-cols-lg-5">
          {[
            "#00eaff",
            "#30d158",
            "#ff453a",
            "#ff9f0a",
            "#bf5af2",
          ].map((color, idx) => (
            <div className="col" key={`stat-skeleton-${idx}`}>
              <div
                className="glass-panel stat-card"
                style={{ borderLeftColor: color }}
              >
                <div
                  className="skeleton-shimmer"
                  style={{ width: "65px", height: "13px", marginBottom: "10px" }}
                />
                <div
                  className="skeleton-shimmer"
                  style={{ width: "45px", height: "32px" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="glass-panel p-4 mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div
              className="skeleton-shimmer"
              style={{ width: "180px", height: "22px" }}
            />
            <div
              className="skeleton-shimmer"
              style={{ width: "260px", height: "36px", borderRadius: "30px" }}
            />
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "70px", height: "14px" }}
                    />
                  </th>
                  <th style={{ width: "10%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "60px", height: "14px" }}
                    />
                  </th>
                  <th style={{ width: "20%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "90px", height: "14px" }}
                    />
                  </th>
                  <th style={{ width: "12%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "75px", height: "14px" }}
                    />
                  </th>
                  <th style={{ width: "15%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "90px", height: "14px" }}
                    />
                  </th>
                  <th style={{ width: "10%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "65px", height: "14px" }}
                    />
                  </th>
                  <th style={{ width: "8%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "50px", height: "14px" }}
                    />
                  </th>
                  <th className="text-end" style={{ width: "10%" }}>
                    <div
                      className="skeleton-shimmer"
                      style={{ width: "60px", height: "14px", marginLeft: "auto" }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <tr key={`row-skel-${i}`}>
                    <td>
                      <div
                        className="skeleton-shimmer"
                        style={{
                          width: "120px",
                          height: "16px",
                          marginBottom: "6px",
                        }}
                      />
                      <div
                        className="skeleton-shimmer"
                        style={{ width: "70px", height: "11px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton-shimmer skeleton-pill"
                        style={{ width: "65px", height: "24px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton-shimmer"
                        style={{
                          width: "170px",
                          height: "24px",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton-shimmer skeleton-pill"
                        style={{ width: "60px", height: "22px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton-shimmer"
                        style={{
                          width: "100px",
                          height: "22px",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton-shimmer"
                        style={{ width: "70px", height: "15px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="skeleton-shimmer skeleton-pill"
                        style={{ width: "60px", height: "22px" }}
                      />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <div
                          className="skeleton-shimmer skeleton-pill"
                          style={{ width: "45px", height: "22px" }}
                        />
                        <div
                          className="skeleton-shimmer skeleton-pill"
                          style={{ width: "45px", height: "22px" }}
                        />
                        <div
                          className="skeleton-shimmer skeleton-pill"
                          style={{ width: "50px", height: "22px" }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

