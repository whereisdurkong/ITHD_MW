USE [ticket_system]
GO

/****** Object:  Table [dbo].[pmsnotes_master]    Script Date: 11/10/2025 10:56:32 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[pmsnotes_master](
	[note_id] [int] IDENTITY(1,1) NOT NULL,
	[pmsticket_id] [int] NOT NULL,
	[note] [nvarchar](max) NOT NULL,
	[created_by] [nvarchar](100) NOT NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[note_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[pmsnotes_master] ADD  DEFAULT (getdate()) FOR [created_at]
GO


