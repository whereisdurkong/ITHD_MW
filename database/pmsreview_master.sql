USE [ticket_system]
GO

/****** Object:  Table [dbo].[pmsreview_master]    Script Date: 11/10/2025 10:57:02 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[pmsreview_master](
	[review_id] [int] IDENTITY(1,1) NOT NULL,
	[review] [nvarchar](max) NULL,
	[user_id] [nvarchar](100) NULL,
	[pmsticket_id] [nvarchar](100) NULL,
	[created_at] [datetime] NULL,
	[created_by] [nvarchar](100) NULL,
	[score] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[review_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[pmsreview_master] ADD  DEFAULT (getdate()) FOR [created_at]
GO


