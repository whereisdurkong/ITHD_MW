USE [ticket_system]
GO

/****** Object:  Table [dbo].[announcements_master]    Script Date: 11/10/2025 10:53:58 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[announcements_master](
	[announcements_id] [int] IDENTITY(1,1) NOT NULL,
	[announcements] [nvarchar](max) NULL,
	[created_by] [nvarchar](100) NULL,
	[created_at] [datetime] NULL,
	[updated_by] [nvarchar](100) NULL,
	[updated_at] [datetime] NULL,
	[is_active] [bit] NULL,
	[announcementTitle] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[announcements_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[announcements_master] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[announcements_master] ADD  DEFAULT ((1)) FOR [is_active]
GO


